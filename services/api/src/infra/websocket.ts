import type { IncomingMessage, Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyAccessToken } from '../utils/jwt';
import { createLogger } from '../lib/logger';

const log = createLogger('websocket');

const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 60_000;

interface AuthenticatedClient extends WebSocket {
  userId?: string;
  subscriptions: Set<string>;
  lastPong: number;
  isAlive: boolean;
}

type WsMessage =
  | { type: 'subscribe'; channel: string }
  | { type: 'unsubscribe'; channel: string }
  | { type: 'ping' };

export class WsServer {
  private readonly wss: WebSocketServer;
  private readonly clients = new Map<string, Set<AuthenticatedClient>>();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(httpServer: Server) {
    this.wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    this.wss.on('connection', (socket, request) => this.onConnection(socket as AuthenticatedClient, request));
    this.pingInterval = setInterval(() => this.heartbeat(), PING_INTERVAL_MS);
    log.info('WebSocket server initialized');
  }

  private extractToken(request: IncomingMessage): string | null {
    const url = new URL(request.url ?? '', 'http://localhost');
    const token = url.searchParams.get('token');
    if (token) return token;

    const auth = request.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);

    return null;
  }

  private onConnection(socket: AuthenticatedClient, request: IncomingMessage): void {
    socket.subscriptions = new Set();
    socket.lastPong = Date.now();
    socket.isAlive = true;

    const token = this.extractToken(request);
    if (token) {
      try {
        const claims = verifyAccessToken(token);
        socket.userId = claims.sub;
      } catch {
        socket.close(1008, 'Invalid token');
        return;
      }
    }

    socket.on('message', (data) => this.onMessage(socket, data.toString()));
    socket.on('pong', () => {
      socket.isAlive = true;
      socket.lastPong = Date.now();
    });
    socket.on('close', () => this.onClose(socket));
    socket.on('error', (err) => {
      log.warn('WebSocket error', { userId: socket.userId, err: err.message });
    });

    log.info('WebSocket connected', { userId: socket.userId ?? 'anonymous' });
  }

  private onMessage(socket: AuthenticatedClient, raw: string): void {
    let msg: WsMessage;
    try {
      msg = JSON.parse(raw) as WsMessage;
    } catch {
      return;
    }

    if (msg.type === 'subscribe') {
      this.subscribe(socket, msg.channel);
    } else if (msg.type === 'unsubscribe') {
      this.unsubscribe(socket, msg.channel);
    } else if (msg.type === 'ping') {
      socket.send(JSON.stringify({ type: 'pong' }));
    }
  }

  private subscribe(socket: AuthenticatedClient, channel: string): void {
    socket.subscriptions.add(channel);
    if (!this.clients.has(channel)) {
      this.clients.set(channel, new Set());
    }
    this.clients.get(channel)!.add(socket);
    socket.send(JSON.stringify({ type: 'subscribed', channel }));
  }

  private unsubscribe(socket: AuthenticatedClient, channel: string): void {
    socket.subscriptions.delete(channel);
    this.clients.get(channel)?.delete(socket);
  }

  private onClose(socket: AuthenticatedClient): void {
    for (const channel of socket.subscriptions) {
      this.clients.get(channel)?.delete(socket);
    }
    log.info('WebSocket disconnected', { userId: socket.userId ?? 'anonymous' });
  }

  private heartbeat(): void {
    const now = Date.now();
    this.wss.clients.forEach((rawSocket) => {
      const socket = rawSocket as AuthenticatedClient;
      if (!socket.isAlive || now - socket.lastPong > PONG_TIMEOUT_MS) {
        socket.terminate();
        return;
      }
      socket.isAlive = false;
      socket.ping();
    });
  }

  broadcast(channel: string, event: Record<string, unknown>): void {
    const subscribers = this.clients.get(channel);
    if (!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify(event);
    for (const socket of subscribers) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }

  broadcastToUser(userId: string, event: Record<string, unknown>): void {
    this.broadcast(`notifications:${userId}`, event);
  }

  async close(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    await new Promise<void>((resolve, reject) => {
      this.wss.close((err) => (err ? reject(err) : resolve()));
    });
  }

  get clientCount(): number {
    return this.wss.clients.size;
  }
}

let wssInstance: WsServer | null = null;

export const getWsServer = (): WsServer | null => wssInstance;

export const initWsServer = (httpServer: Server): WsServer => {
  wssInstance = new WsServer(httpServer);
  return wssInstance;
};
