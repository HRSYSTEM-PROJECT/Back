import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk.guard';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway
  ) {}

  // 🔍 Buscar usuarios para chat
  @Get('users/search')
  @ApiOperation({ summary: 'Buscar usuarios para iniciar chat' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente'
  })
  async searchUsers(
    @Request() req,
    @Query('q') query: string = '',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    if (!req.user || !req.user.id) {
      throw new Error('Usuario no autenticado');
    }
    return this.chatService.searchUsers(req.user.id, query, page, limit);
  }

  // 📝 Crear chat directo con otro usuario
  @Post('direct/:otherUserId')
  @ApiOperation({ summary: 'Crear chat directo con otro usuario' })
  @ApiResponse({ status: 201, description: 'Chat directo creado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async createDirectChat(
    @Request() req,
    @Param('otherUserId') otherUserId: string
  ) {
    if (!req.user || !req.user.id) {
      throw new Error('Usuario no autenticado');
    }

    const chat = await this.chatService.createDirectChat(
      req.user.id,
      otherUserId
    );

    // 🔗 Unir automáticamente a los participantes del chat
    await this.chatGateway.joinUsersToChat(chat.id);

    // Transformar el chat para enviar los participantes correctamente
    const transformedChat = {
      ...chat,
      participants: chat.participants.map(participant => ({
        id: participant.user.id,
        first_name: participant.user.first_name,
        last_name: participant.user.last_name,
        email: participant.user.email,
        profile_image_url: participant.user.profile_image_url
      }))
    };

    return transformedChat;
  }

  // 📋 Obtener chats del usuario
  @Get()
  @ApiOperation({ summary: 'Obtener chats del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de chats obtenida exitosamente'
  })
  async getUserChats(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    // Validar que req.user existe antes de usarlo
    if (!req.user || !req.user.id) {
      throw new Error('Usuario no autenticado o datos de usuario incompletos');
    }

    const result = await this.chatService.getUserChats(req.user.id, page, limit);
    
    // Transformar los chats para asegurar que los participantes se envíen correctamente
    const transformedChats = result.chats.map(chat => ({
      ...chat,
      participants: chat.participants.map(participant => ({
        id: participant.user.id,
        first_name: participant.user.first_name,
        last_name: participant.user.last_name,
        email: participant.user.email,
        profile_image_url: participant.user.profile_image_url
      }))
    }));

    return {
      ...result,
      chats: transformedChats
    };
  }

  // 📋 Obtener chat específico
  @Get(':chatId')
  @ApiOperation({ summary: 'Obtener chat específico' })
  @ApiResponse({ status: 200, description: 'Chat obtenido exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin acceso al chat' })
  async getChat(@Request() req, @Param('chatId') chatId: string) {
    if (!req.user || !req.user.id) {
      throw new Error('Usuario no autenticado');
    }
    return await this.chatService.getChat(chatId, req.user.id);
  }

  // 💬 Enviar mensaje
  @Post(':chatId/messages')
  @ApiOperation({ summary: 'Enviar mensaje a un chat' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin acceso al chat' })
  async sendMessage(
    @Request() req,
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto
  ) {
    if (!req.user || !req.user.id) {
      throw new Error('Usuario no autenticado');
    }
    return this.chatService.sendMessage(req.user.id, chatId, sendMessageDto);
  }

  // 💬 Obtener mensajes de un chat
  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Obtener mensajes de un chat' })
  @ApiResponse({ status: 200, description: 'Mensajes obtenidos exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin acceso al chat' })
  async getChatMessages(
    @Request() req,
    @Param('chatId') chatId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50
  ) {
    if (!req.user || !req.user.id) {
      throw new Error('Usuario no autenticado');
    }
    return this.chatService.getChatMessages(chatId, req.user.id, page, limit);
  }

  // ✏️ Editar mensaje
  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Editar mensaje' })
  @ApiResponse({ status: 200, description: 'Mensaje editado exitosamente' })
  @ApiResponse({ status: 404, description: 'Mensaje no encontrado' })
  async editMessage(
    @Request() req,
    @Param('messageId') messageId: string,
    @Body('content') content: string
  ) {
    if (!req.user || !req.user.id) {
      throw new Error('Usuario no autenticado');
    }
    return this.chatService.editMessage(req.user.id, messageId, content);
  }

  // 🗑️ Eliminar mensaje
  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Eliminar mensaje' })
  @ApiResponse({ status: 200, description: 'Mensaje eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Mensaje no encontrado' })
  @HttpCode(HttpStatus.OK)
  async deleteMessage(@Request() req, @Param('messageId') messageId: string) {
    if (!req.user || !req.user.id) {
      throw new Error('Usuario no autenticado');
    }
    await this.chatService.deleteMessage(req.user.id, messageId);
    return { message: 'Mensaje eliminado exitosamente' };
  }
}
