/**
 * Professional WebSocket Service
 * Real-time updates for user engagement, notifications, and live activity
 */

interface WebSocketMessage {
  type: 'notification' | 'activity' | 'engagement' | 'live-update' | 'user-insight';
  payload: any;
  timestamp: number;
}

interface RealtimeEngagement {
  viewsInLastHour: number;
  engagementRate: number;
  activeListeners: number;
  newFollowers: number;
  topContent: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(_payload: any) => void>> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private isConnected = false;

  constructor(url: string = 'wss://api.claudygod.com/ws') {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId: string, authToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isConnected) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        const connectionUrl = `${this.url}?userId=${userId}&token=${authToken}`;

        this.ws = new WebSocket(connectionUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Flush queued messages
          this.flushQueue();

          console.log('✅ WebSocket connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          if (!this.isConnected) {
            reject(error);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.isConnecting = false;
          this.attemptReconnect(userId, authToken);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Subscribe to real-time events
   */
  subscribe(eventType: string, callback: (_payload: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      callbacks?.delete(callback);
    };
  }

  /**
   * Send message to server
   */
  send(eventType: string, payload: any): void {
    const message: WebSocketMessage = {
      type: eventType as any,
      payload,
      timestamp: Date.now(),
    };

    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  /**
   * Private: Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(message.payload));
    }
  }

  /**
   * Private: Flush queued messages
   */
  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Private: Attempt reconnection
   */
  private attemptReconnect(userId: string, authToken: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

      console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts})...`);
      setTimeout(() => {
        this.connect(userId, authToken).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.listeners.clear();
    this.messageQueue = [];
  }

  /**
   * Check if connected
   */
  isConnectedState(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

export type { WebSocketMessage, RealtimeEngagement };
