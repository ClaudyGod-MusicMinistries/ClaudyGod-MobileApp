import { getWsServer } from '../../infra/websocket';

export interface LiveEvent {
  type: 'message' | 'session_update' | 'viewer_count';
  payload: Record<string, unknown>;
}

export function broadcastToLiveSession(sessionId: string, event: LiveEvent): void {
  const wss = getWsServer();
  if (!wss) return;
  wss.broadcast(`live:${sessionId}`, {
    type: event.type,
    channel: `live:${sessionId}`,
    payload: event.payload,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastViewerCount(sessionId: string, count: number): void {
  broadcastToLiveSession(sessionId, {
    type: 'viewer_count',
    payload: { count },
  });
}

export function broadcastSessionUpdate(
  sessionId: string,
  update: Record<string, unknown>,
): void {
  broadcastToLiveSession(sessionId, {
    type: 'session_update',
    payload: update,
  });
}
