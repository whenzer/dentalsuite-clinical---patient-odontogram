/**
 * DentalSuite WebSocket Realtime Client Helper
 * Connects to NestJS ClinicalGateway for multi-operatory synchronization
 */

export type RealtimeCallback = (data: any) => void;

class RealtimeSocketClient {
  private listeners: Map<string, RealtimeCallback[]> = new Map();
  private ws: WebSocket | null = null;
  private isConnected = false;

  connect(wsUrl?: string) {
    if (this.ws && this.isConnected) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultUrl = `${protocol}//${window.location.host}/socket.io/?EIO=4&transport=websocket`;
    const targetUrl = wsUrl || defaultUrl;

    try {
      this.ws = new WebSocket(targetUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event && this.listeners.has(payload.event)) {
            this.listeners.get(payload.event)?.forEach((cb) => cb(payload.data));
          }
        } catch {
          // Non-JSON or protocol heartbeat
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Auto-reconnect after 3 seconds
        setTimeout(() => this.connect(wsUrl), 3000);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      // In dev without backend running, fail silently
    }
  }

  on(event: string, callback: RealtimeCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: RealtimeCallback) {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(
      event,
      list.filter((cb) => cb !== callback),
    );
  }
}

export const realtimeClient = new RealtimeSocketClient();
