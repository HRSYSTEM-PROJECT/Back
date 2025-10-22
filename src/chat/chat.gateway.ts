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
  private userSockets = new Map<string, string>(); // userId -> socketId
  private socketUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private chatService: ChatService,
    private userService: UserService
  ) {}

  // 🔌 Manejar conexión
  async handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado: ${client.id}`);

    try {
      // 🔐 Validar token JWT
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`❌ Conexión rechazada: Sin token`);
        client.disconnect();
        return;
      }

      // Verificar token de Clerk
      const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
      const clerkUserId = payload.sub;

      if (!clerkUserId) {
        this.logger.warn(`❌ Conexión rechazada: Token de Clerk inválido`);
        client.disconnect();
        return;
      }

      // Buscar usuario en DB
      const userDB = await this.userService.findByClerkId(clerkUserId);
      if (!userDB) {
        this.logger.warn(`❌ Conexión rechazada: Usuario no encontrado en DB`);
        client.disconnect();
        return;
      }

      // ✅ Usuario autenticado
      this.userSockets.set(userDB.id, client.id);
      this.socketUsers.set(client.id, userDB.id);

      // Unir al usuario a sus chats
      await this.joinUserChats(client, userDB.id);

      this.logger.log(
        `✅ Usuario ${userDB.id} (${userDB.email}) autenticado y conectado`
      );
    } catch (error) {
      this.logger.warn(`❌ Conexión rechazada: ${error.message}`);
      client.disconnect();
    }
  }

  // 🔌 Manejar desconexión
  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Cliente desconectado: ${client.id}`);

    const userId = this.socketUsers.get(client.id);
    if (userId) {
      this.userSockets.delete(userId);
      this.socketUsers.delete(client.id);
      this.logger.log(`👤 Usuario ${userId} desconectado`);
    }
  }

  // 💬 Enviar mensaje
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; message: SendMessageDto }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      client.emit('error', { message: 'Usuario no autenticado' });
      return;
    }

    try {
      const message = await this.chatService.sendMessage(
        userId,
        data.chatId,
        data.message
      );

      // Enviar mensaje a todos los participantes del chat
      await this.broadcastToChat(data.chatId, 'new_message', message);

      this.logger.log(
        `💬 Mensaje enviado en chat ${data.chatId} por usuario ${userId}`
      );
    } catch (error: any) {
      client.emit('error', { message: error.message });
      this.logger.error(`❌ Error enviando mensaje:`, error);
    }
  }

  // 📝 Editar mensaje
  @SubscribeMessage('edit_message')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      client.emit('error', { message: 'Usuario no autenticado' });
      return;
    }

    try {
      const message = await this.chatService.editMessage(
        userId,
        data.messageId,
        data.content
      );

      // Enviar mensaje editado a todos los participantes del chat
      await this.broadcastToChat(message.chat_id, 'message_edited', message);

      this.logger.log(
        `✏️ Mensaje editado ${data.messageId} por usuario ${userId}`
      );
    } catch (error: any) {
      client.emit('error', { message: error.message });
      this.logger.error(`❌ Error editando mensaje:`, error);
    }
  }

  // 🗑️ Eliminar mensaje
  @SubscribeMessage('delete_message')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      client.emit('error', { message: 'Usuario no autenticado' });
      return;
    }

    try {
      await this.chatService.deleteMessage(userId, data.messageId);

      // Notificar eliminación a todos los participantes del chat
      await this.broadcastToChat(data.messageId, 'message_deleted', {
        messageId: data.messageId
      });

      this.logger.log(
        `🗑️ Mensaje eliminado ${data.messageId} por usuario ${userId}`
      );
    } catch (error: any) {
      client.emit('error', { message: error.message });
      this.logger.error(`❌ Error eliminando mensaje:`, error);
    }
  }

  // 👤 Marcar mensajes como leídos
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      client.emit('error', { message: 'Usuario no autenticado' });
      return;
    }

    try {
      // Actualizar timestamp de última lectura
      await this.chatService.getChatMessages(data.chatId, userId, 1, 1);

      // Notificar a otros participantes que el usuario leyó los mensajes
      await this.broadcastToChat(
        data.chatId,
        'messages_read',
        {
          userId,
          chatId: data.chatId,
          timestamp: new Date()
        },
        userId
      );

      this.logger.log(
        `👤 Mensajes marcados como leídos en chat ${data.chatId} por usuario ${userId}`
      );
    } catch (error: any) {
      client.emit('error', { message: error.message });
      this.logger.error(`❌ Error marcando mensajes como leídos:`, error);
    }
  }

  // 👥 Unirse a un chat
  @SubscribeMessage('join_chat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      client.emit('error', { message: 'Usuario no autenticado' });
      return;
    }

    try {
      client.join(`chat_${data.chatId}`);
      this.logger.log(`👥 Usuario ${userId} se unió al chat ${data.chatId}`);
    } catch (error: any) {
      client.emit('error', { message: error.message });
      this.logger.error(`❌ Error uniéndose al chat:`, error);
    }
  }

  // 🚪 Salir de un chat
  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string }
  ) {
    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      client.emit('error', { message: 'Usuario no autenticado' });
      return;
    }

    try {
      client.leave(`chat_${data.chatId}`);
      this.logger.log(`🚪 Usuario ${userId} salió del chat ${data.chatId}`);
    } catch (error: any) {
      client.emit('error', { message: error.message });
      this.logger.error(`❌ Error saliendo del chat:`, error);
    }
  }

  // 🔧 Métodos auxiliares

  // Unir usuario a todos sus chats
  private async joinUserChats(client: Socket, userId: string) {
    try {
      const { chats } = await this.chatService.getUserChats(userId);

      for (const chat of chats) {
        client.join(`chat_${chat.id}`);
      }

      this.logger.log(`👥 Usuario ${userId} unido a ${chats.length} chats`);
    } catch (error: any) {
      this.logger.error(`❌ Error uniendo usuario a chats:`, error);
    }
  }

  // 🔗 Método público para unir usuarios a un chat específico
  async joinUsersToChat(chatId: string) {
    try {
      // Verificar que el servidor esté inicializado
      if (!this.server) {
        this.logger.warn(`⚠️ Servidor WebSocket no inicializado`);
        return;
      }

      // Verificar que el servidor tenga la estructura de sockets correcta
      if (!this.server.sockets || !this.server.sockets.sockets) {
        this.logger.warn(`⚠️ Estructura de sockets no disponible`);
        return;
      }

      // Obtener todos los participantes del chat
      const participants = await this.chatService.getChatParticipants(chatId);

      if (!participants || participants.length === 0) {
        this.logger.warn(
          `⚠️ No se encontraron participantes para el chat ${chatId}`
        );
        return;
      }

      let joinedCount = 0;

      for (const participant of participants) {
        const socketId = this.userSockets.get(participant.user_id);
        if (socketId) {
          // Verificar que el socket existe usando el método correcto
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket) {
            socket.join(`chat_${chatId}`);
            joinedCount++;
            this.logger.log(
              `👥 Usuario ${participant.user_id} unido al chat ${chatId}`
            );
          } else {
            this.logger.warn(
              `⚠️ Socket ${socketId} no encontrado para usuario ${participant.user_id}`
            );
          }
        } else {
          this.logger.warn(
            `⚠️ Usuario ${participant.user_id} no está conectado`
          );
        }
      }

      this.logger.log(
        `✅ ${joinedCount} usuarios unidos al chat ${chatId} de ${participants.length} participantes`
      );
    } catch (error: any) {
      this.logger.error(`❌ Error uniendo usuarios al chat ${chatId}:`, error);
    }
  }

  // Enviar mensaje a todos los participantes de un chat
  private broadcastToChat(
    chatId: string,
    event: string,
    data: any,
    excludeUserId?: string
  ) {
    const room = `chat_${chatId}`;

    if (excludeUserId) {
      const excludeSocketId = this.userSockets.get(excludeUserId);
      if (excludeSocketId) {
        this.server.to(room).except(excludeSocketId).emit(event, data);
      } else {
        this.server.to(room).emit(event, data);
      }
    } else {
      this.server.to(room).emit(event, data);
    }
  }

  // Enviar notificación a un usuario específico
  sendNotificationToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(`📨 Notificación enviada a usuario ${userId}: ${event}`);
    } else {
      this.logger.warn(`⚠️ Usuario ${userId} no está conectado`);
    }
  }

  // Obtener usuarios conectados en un chat
  async getConnectedUsersInChat(chatId: string): Promise<string[]> {
    const room = `chat_${chatId}`;
    const sockets = await this.server.in(room).fetchSockets();

    return sockets
      .map((socket) => this.socketUsers.get(socket.id))
      .filter((userId) => userId !== undefined);
  }
}
