/**
 * DentalSuite WebSocket Realtime Client Helper
 * Connects to NestJS ClinicalGateway for multi-operatory synchronization
 */

import { io, Socket } from 'socket.io-client';
import { apiClient } from './apiClient';

export type RealtimeCallback = (data: any) => void;

class RealtimeSocketClient {
  private listeners: Map<string, RealtimeCallback[]> = new Map();
  private socket: Socket | null = null;
  private isConnected = false;

  connect(wsUrl?: string) {
    if (this.socket?.connected) return;

    const apiUrl = wsUrl || apiClient.getBaseUrl();
    const socketUrl = apiUrl.startsWith('http')
      ? apiUrl.replace(/\/api\/v1\/?$/, '')
      : window.location.origin;

    this.socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
    });

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => this.socket?.on(event, callback));
    });
  }

  on(event: string, callback: RealtimeCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    this.socket?.on(event, callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: RealtimeCallback) {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(
      event,
      list.filter((cb) => cb !== callback),
    );
    this.socket?.off(event, callback);
  }
}

export const realtimeClient = new RealtimeSocketClient();
