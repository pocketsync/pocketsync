import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@NestWebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3030',
    credentials: true,
  },
  namespace: 'changes',
  transports: ['websocket', 'polling'],
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private deviceConnections = new Map<string, Socket>();

  handleConnection(client: Socket) {
    const deviceId = client.handshake.query.deviceId as string;
    if (deviceId) {
      this.deviceConnections.set(deviceId, client);
      console.log(`Device ${deviceId} connected`);
    }
  }

  handleDisconnect(client: Socket) {
    const deviceId = client.handshake.query.deviceId as string;
    if (deviceId) {
      this.deviceConnections.delete(deviceId);
      console.log(`Device ${deviceId} disconnected`);
    }
  }

  notifyDevice(deviceId: string, payload: any) {
    const client = this.deviceConnections.get(deviceId);
    if (client) {
      client.emit('change', payload);
      console.log(`Notified device ${deviceId} of changes`);
    }
  }
}