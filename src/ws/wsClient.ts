import type { WsEvent, WsEventType } from '../types';

const WS_PATH: string = import.meta.env.VITE_WS_PATH ?? '/ws';

type WsStatus = 'connected' | 'disconnected' | 'reconnecting' | 'failed';
type WsHandler = (event: WsEvent) => void;

function resolveWsUrl(path: string): string {
  if (path.startsWith('ws://') || path.startsWith('wss://')) {
    return path;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path.startsWith('/') ? path : `/${path}`}`;
}

export class WsClient {
  private socket: WebSocket | null = null;
  private listeners: Map<WsEventType, Set<WsHandler>> = new Map();
  private reconnectAttempts = 0;
  private reconnectDelays = [1000, 2000, 5000];
  public status: WsStatus = 'disconnected';

  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.socket = new WebSocket(resolveWsUrl(WS_PATH));

    this.socket.onopen = () => {
      this.status = 'connected';
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent;
        this.dispatch(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    this.socket.onclose = (event) => {
      this.socket = null;

      if (event.code === 1000) {
        this.status = 'disconnected';
        return;
      }

      this.scheduleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error', error);
    };
  }

  disconnect(): void {
    this.status = 'disconnected';

    if (this.socket) {
      this.socket.close(1000);
      this.socket = null;
    }
  }

  on(eventType: WsEventType, handler: WsHandler): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)?.add(handler);
  }

  off(eventType: WsEventType, handler: WsHandler): void {
    this.listeners.get(eventType)?.delete(handler);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.reconnectDelays.length) {
      const delay = this.reconnectDelays[this.reconnectAttempts];
      this.status = 'reconnecting';
      this.reconnectAttempts += 1;
      window.setTimeout(() => this.connect(), delay);
      return;
    }

    this.status = 'failed';
  }

  private dispatch(event: WsEvent): void {
    this.listeners.get(event.type)?.forEach((handler) => {
      handler(event);
    });
  }
}

export const wsClient = new WsClient();
