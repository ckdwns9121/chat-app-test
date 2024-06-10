import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export class AddMessageDto {
  author: string;
  body: string;
  room: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private rooms: { [key: string]: string[] } = {};

  @SubscribeMessage('createRoom')
  handleCreateRoom(@MessageBody() room: string): void {
    console.log(room);
    this.rooms[room] = [];
    this.server.emit('roomCreated', room);
  }

  @SubscribeMessage('chat')
  handleMessage(@MessageBody() payload: AddMessageDto): AddMessageDto {
    console.log(payload);
    this.logger.log(`Message received: ${payload.author} - ${payload.body}`);
    this.server.to(payload.room).emit('chat', payload);
    return payload;
  }
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    client.emit('joinedRoom', room); // 클라이언트에게 'joinedRoom' 이벤트 발생
    console.log(`Client ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room);
    client.emit('leftRoom', room); // 클라이언트에게 'leftRoom' 이벤트 발생
    console.log(`Client ${client.id} left room: ${room}`);
  }

  handleConnection(socket: Socket) {
    this.logger.log(`Socket connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`Socket disconnected: ${socket.id}`);
  }
}
