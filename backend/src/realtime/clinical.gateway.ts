import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ClinicalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ClinicalGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Clinical station connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Clinical station disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:patient')
  handleJoinPatientRoom(
    @MessageBody() data: { patientId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.patientId) {
      client.join(`patient:${data.patientId}`);
      this.logger.log(`Socket ${client.id} joined room patient:${data.patientId}`);
      return { success: true, room: `patient:${data.patientId}` };
    }
  }

  @SubscribeMessage('leave:patient')
  handleLeavePatientRoom(
    @MessageBody() data: { patientId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data?.patientId) {
      client.leave(`patient:${data.patientId}`);
      return { success: true };
    }
  }

  // Broadcast helpers called by other services
  broadcastOdontogramUpdate(patientId: string, chart: any) {
    if (!this.server) return;
    this.server.emit('odontogram:updated', { patientId, chart, timestamp: new Date().toISOString() });
    this.server.to(`patient:${patientId}`).emit('odontogram:patient_updated', { chart });
  }

  broadcastAppointmentUpdate(appointment: any, eventType: 'created' | 'updated' | 'cancelled' | 'status_changed') {
    if (!this.server) return;
    this.server.emit(`appointment:${eventType}`, { appointment, timestamp: new Date().toISOString() });
  }

  broadcastChairStatusChange(chairId: string, status: string, chair: any) {
    if (!this.server) return;
    this.server.emit('chair:status_changed', { chairId, status, chair, timestamp: new Date().toISOString() });
  }

  broadcastConsumableLowStock(item: any) {
    if (!this.server) return;
    this.server.emit('inventory:low_stock', { item, timestamp: new Date().toISOString() });
  }
}
