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
import { SendMessageDto } from './dto/send-message.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk.guard';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 📝 Crear chat directo con otro usuario
  @Post('direct/:otherUserId')
  @ApiOperation({ summary: 'Crear chat directo con otro usuario' })
  @ApiResponse({ status: 201, description: 'Chat directo creado exitosamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async createDirectChat(
    @Request() req,
    @Param('otherUserId') otherUserId: string
  ) {
    return await this.chatService.createDirectChat(req.user.id, otherUserId);
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
    return this.chatService.getUserChats(req.user.id, page, limit);
  }

  // 📋 Obtener chat específico
  @Get(':chatId')
  @ApiOperation({ summary: 'Obtener chat específico' })
  @ApiResponse({ status: 200, description: 'Chat obtenido exitosamente' })
  @ApiResponse({ status: 403, description: 'Sin acceso al chat' })
  async getChat(@Request() req, @Param('chatId') chatId: string) {
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
    return this.chatService.editMessage(req.user.id, messageId, content);
  }

  // 🗑️ Eliminar mensaje
  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Eliminar mensaje' })
  @ApiResponse({ status: 200, description: 'Mensaje eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Mensaje no encontrado' })
  @HttpCode(HttpStatus.OK)
  async deleteMessage(@Request() req, @Param('messageId') messageId: string) {
    await this.chatService.deleteMessage(req.user.id, messageId);
    return { message: 'Mensaje eliminado exitosamente' };
  }
}
