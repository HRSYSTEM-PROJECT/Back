import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { CLERK_SECRET_KEY } from 'src/config/envs';
import { UserService } from 'src/user/user.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  namespace: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<string, Socket>(); // userId -> Socket
  private socketUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService
  ) {}

  // 🔌 Conexión
  async handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado: ${client.id}`);

    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn('❌ Sin token, desconectando cliente');
        return client.disconnect();
      }

      const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
      const clerkUserId = payload.sub;

      if (!clerkUserId) {
        this.logger.warn('❌ Token de Clerk inválido');
        return client.disconnect();
      }

      const userDB = await this.userService.findByClerkId(clerkUserId);
      if (!userDB) {
        this.logger.warn('❌ Usuario no encontrado en DB');
        return client.disconnect();
      }

      // Guardar relación
      this.userSockets.set(userDB.id, client);
      this.socketUsers.set(client.id, userDB.id);

      await this.joinUserChats(client, userDB.id);

      this.logger.log(`✅ Usuario ${userDB.id} conectado`);
      
      // 📢 Notificar a todos que este usuario se conectó
      this.server.emit('user_connected', { userId: userDB.id });
    } catch (error: any) {
      this.logger.error(`❌ Error en conexión: ${error.message}`);
      client.disconnect();
    }
  }

  // 🔌 Desconexión
  handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id);

    if (userId) {
      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);
      this.logger.log(`👤 Usuario ${userId} desconectado`);
      
      // 📢 Notificar a todos que este usuario se desconectó
      this.server.emit('user_disconnected', { userId });
    }
  }

  // 💬 Enviar mensaje
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; message: SendMessageDto }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return client.emit('error', { message: 'Usuario no autenticado' });

    try {
      const message = await this.chatService.sendMessage(
        userId,
        data.chatId,
        data.message
      );

      // Transformar el mensaje para incluir el chatId
      const messageToSend = {
        ...message,
        chatId: data.chatId
      };

      this.broadcastToChat(data.chatId, 'new_message', messageToSend);
      this.logger.log(`💬 Mensaje enviado en chat ${data.chatId}`);
    } catch (error: any) {
      this.logger.error(`❌ Error enviando mensaje: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  // ✏️ Editar mensaje
  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return client.emit('error', { message: 'Usuario no autenticado' });

    try {
      const message = await this.chatService.editMessage(
        userId,
        data.messageId,
        data.content
      );

      this.broadcastToChat(message.chat_id, 'message_edited', message);
    } catch (error: any) {
      this.logger.error(`❌ Error editando mensaje: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  // 🗑️ Eliminar mensaje
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; chatId: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return client.emit('error', { message: 'Usuario no autenticado' });

    try {
      await this.chatService.deleteMessage(userId, data.messageId);

      this.broadcastToChat(data.chatId, 'message_deleted', {
        messageId: data.messageId
      });
    } catch (error: any) {
      this.logger.error(`❌ Error eliminando mensaje: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  // 👁️ Marcar como leído
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return client.emit('error', { message: 'Usuario no autenticado' });

    try {
      await this.chatService.getChatMessages(data.chatId, userId, 1, 1);
      this.broadcastToChat(
        data.chatId,
        'messages_read',
        { userId, chatId: data.chatId, timestamp: new Date() },
        userId
      );
    } catch (error: any) {
      this.logger.error(`❌ Error marcando como leído: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  // 👥 Unirse a un chat
  @SubscribeMessage('join_chat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return client.emit('error', { message: 'Usuario no autenticado' });

    client.join(`chat_${data.chatId}`);
    this.logger.log(`👥 Usuario ${userId} se unió al chat ${data.chatId}`);
  }

  // 🚪 Salir de un chat
  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) return client.emit('error', { message: 'Usuario no autenticado' });

    client.leave(`chat_${data.chatId}`);
    this.logger.log(`🚪 Usuario ${userId} salió del chat ${data.chatId}`);
  }

  // 🔧 Auxiliares
  private async joinUserChats(client: Socket, userId: string) {
    try {
      const { chats } = await this.chatService.getUserChats(userId);
      chats.forEach((chat) => client.join(`chat_${chat.id}`));
      this.logger.log(`👥 Usuario ${userId} unido a ${chats.length} chats`);
    } catch (error: any) {
      this.logger.error(`❌ Error uniendo usuario a chats: ${error.message}`);
    }
  }

  // 🔗 Unir usuarios específicos a un chat (usado por el Controller)
  async joinUsersToChat(chatId: string) {
    try {
      const participants = await this.chatService.getChatParticipants(chatId);
      
      participants.forEach((participant) => {
        const socket = this.userSockets.get(participant.user_id);
        if (socket) {
          socket.join(`chat_${chatId}`);
          this.logger.log(`👥 Usuario ${participant.user_id} unido al nuevo chat ${chatId}`);
        }
      });
    } catch (error: any) {
      this.logger.error(`❌ Error uniendo usuarios al chat: ${error.message}`);
    }
  }

  private broadcastToChat(
    chatId: string,
    event: string,
    data: any,
    excludeUserId?: string
  ) {
    const room = `chat_${chatId}`;
    if (excludeUserId) {
      const excludeSocket = this.userSockets.get(excludeUserId);
      if (excludeSocket) this.server.to(room).except(excludeSocket.id).emit(event, data);
      else this.server.to(room).emit(event, data);
    } else {
      this.server.to(room).emit(event, data);
    }
  }

  sendNotificationToUser(userId: string, event: string, data: any) {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit(event, data);
      this.logger.log(`📨 Notificación enviada a usuario ${userId}: ${event}`);
    } else {
      this.logger.warn(`⚠️ Usuario ${userId} no está conectado`);
    }
  }

  async getConnectedUsersInChat(chatId: string): Promise<string[]> {
    const sockets = await this.server.in(`chat_${chatId}`).fetchSockets();
    return sockets
      .map((socket) => this.socketUsers.get(socket.id))
      .filter((id): id is string => !!id);
  }

  // 📊 Obtener usuarios conectados (útil para el frontend)
  getConnectedUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
