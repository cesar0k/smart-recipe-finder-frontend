type MessageHandler = (data: unknown) => void;

const WS_BASE =
  (import.meta.env.VITE_WS_URL as string) ||
  `ws://${window.location.hostname}:8001`;

const HEARTBEAT_INTERVAL = 30_000; // 30s
const RECONNECT_BASE = 1_000; // 1s
const RECONNECT_MAX = 30_000; // 30s

export class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private token: string | null = null;
  private intentionalClose = false;

  connect(token: string): void {
    this.token = token;
    this.intentionalClose = false;
    this._open();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this._cleanup();
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private _open(): void {
    if (!this.token) return;

    try {
      this.ws = new WebSocket(
        `${WS_BASE}/api/v1/ws/notifications?token=${encodeURIComponent(this.token)}`
      );

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this._startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        if (event.data === "pong") return; // heartbeat response

        try {
          const data: unknown = JSON.parse(event.data as string);
          for (const handler of this.handlers) {
            handler(data);
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      this.ws.onclose = () => {
        this._stopHeartbeat();
        if (!this.intentionalClose) {
          this._scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // onclose will fire after onerror
      };
    } catch {
      this._scheduleReconnect();
    }
  }

  private _startHeartbeat(): void {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, HEARTBEAT_INTERVAL);
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private _scheduleReconnect(): void {
    if (this.intentionalClose) return;

    const delay = Math.min(
      RECONNECT_BASE * 2 ** this.reconnectAttempt,
      RECONNECT_MAX
    );
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this._open();
    }, delay);
  }

  private _cleanup(): void {
    this._stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      ) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  /** Update token (e.g. after refresh) without full reconnect */
  updateToken(token: string): void {
    this.token = token;
  }
}

/** Singleton instance */
export const notificationWS = new NotificationWebSocket();
