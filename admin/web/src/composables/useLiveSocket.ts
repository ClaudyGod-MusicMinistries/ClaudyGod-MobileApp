import { getAccessToken, API_URL } from '@/api/client';

export interface LiveSocketFrame {
  type: 'message' | 'message_status' | 'session_update' | 'viewer_count';
  channel: string;
  payload: unknown;
  timestamp: string;
}

type FrameHandler = (frame: LiveSocketFrame) => void;

// One shared socket for the whole admin app, subscribing to one channel per
// live session (`live:<sessionId>`) — mirrors the protocol the mobile client's
// live session screen already speaks against the same backend (subscribe on
// open, message/message_status/session_update/viewer_count frames back).
let socket: WebSocket | null = null;
let connecting = false;
let cancelled = true;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const channelHandlers = new Map<string, Set<FrameHandler>>();

function clearReconnectTimer(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function resubscribeAll(): void {
  for (const channel of channelHandlers.keys()) {
    socket?.send(JSON.stringify({ type: 'subscribe', channel }));
  }
}

function connectSocket(): void {
  if (connecting || socket?.readyState === WebSocket.OPEN) return;
  connecting = true;
  cancelled = false;

  const token = getAccessToken();
  const wsBase = API_URL.replace(/^http/, 'ws');
  const url = `${wsBase}/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  socket = new WebSocket(url);

  socket.onopen = () => {
    connecting = false;
    reconnectAttempt = 0;
    resubscribeAll();
  };
  socket.onmessage = (event) => {
    try {
      const frame = JSON.parse(String(event.data)) as LiveSocketFrame;
      const handlers = channelHandlers.get(frame.channel);
      handlers?.forEach((handler) => handler(frame));
    } catch {
      // Malformed frame — ignore silently.
    }
  };
  socket.onerror = () => { /* onclose fires right after and drives the retry */ };
  socket.onclose = () => {
    connecting = false;
    if (!cancelled && channelHandlers.size > 0) {
      clearReconnectTimer();
      const delay = Math.min(1000 * 2 ** reconnectAttempt, 20000);
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => connectSocket(), delay);
    }
  };
}

function disconnectSocket(): void {
  cancelled = true;
  clearReconnectTimer();
  if (socket) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

export function useLiveSocket() {
  function subscribe(channel: string, onFrame: FrameHandler): () => void {
    if (!channelHandlers.has(channel)) {
      channelHandlers.set(channel, new Set());
    }
    channelHandlers.get(channel)!.add(onFrame);

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'subscribe', channel }));
    } else {
      connectSocket();
    }

    return () => {
      const handlers = channelHandlers.get(channel);
      handlers?.delete(onFrame);
      if (handlers && handlers.size === 0) {
        channelHandlers.delete(channel);
        socket?.send(JSON.stringify({ type: 'unsubscribe', channel }));
      }
      if (channelHandlers.size === 0) {
        disconnectSocket();
      }
    };
  }

  return { subscribe };
}
