import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChatType } from './entities/chat.entity';
import { Message, MessageType } from './entities/message.entity';
import {
  ChatParticipant,
  ParticipantRole
} from './entities/chat-participant.entity';
import { User } from '../user/entities/user.entity';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(ChatParticipant)
    private participantRepository: Repository<ChatParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  // 🔍 Buscar usuarios para chat (SOLO DE LA MISMA EMPRESA)
  async searchUsers(
    currentUserId: string,
    query: string = '',
    page: number = 1,
    limit: number = 20
  ) {
    this.logger.log(
      `🔍 Buscando usuarios para chat en la misma empresa: "${query}"`
    );

    // Primero obtener la empresa del usuario actual
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['company']
    });

    if (!currentUser || !currentUser.company) {
      throw new NotFoundException(
        'Usuario no encontrado o sin empresa asignada'
      );
    }

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere('user.deleted_at IS NULL')
      .andWhere('company.id = :companyId', {
        companyId: currentUser.company.id
      });

    // Si hay query, buscar por nombre o email
    if (query.trim()) {
      queryBuilder.andWhere(
        '(LOWER(user.first_name) LIKE LOWER(:query) OR ' +
          'LOWER(user.last_name) LIKE LOWER(:query) OR ' +
          'LOWER(user.email) LIKE LOWER(:query))',
        { query: `%${query}%` }
      );
    }

    // Paginación
    const offset = (page - 1) * limit;
    const [users, total] = await queryBuilder
      .orderBy('user.first_name', 'ASC')
      .addOrderBy('user.last_name', 'ASC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    this.logger.log(
      `🔍 Encontrados ${users.length} usuarios de la empresa ${currentUser.company.legal_name}`
    );

    return {
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name} ${user.last_name}`.trim()
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 📝 Crear chat directo entre dos usuarios (MISMA EMPRESA)
  async createDirectChat(userId: string, otherUserId: string): Promise<Chat> {
    this.logger.log(`📝 Creando chat directo entre ${userId} y ${otherUserId}`);

    // Obtener ambos usuarios con sus empresas
    const [currentUser, otherUser] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId },
        relations: ['company']
      }),
      this.userRepository.findOne({
        where: { id: otherUserId },
        relations: ['company']
      })
    ]);

    if (!currentUser || !currentUser.company) {
      throw new NotFoundException(
        'Usuario actual no encontrado o sin empresa asignada'
      );
    }

    if (!otherUser || !otherUser.company) {
      throw new NotFoundException(
        'Usuario destino no encontrado o sin empresa asignada'
      );
    }

    // ✅ VALIDAR QUE AMBOS USUARIOS PERTENEZCAN A LA MISMA EMPRESA
    if (currentUser.company.id !== otherUser.company.id) {
      throw new ForbiddenException(
        'No puedes chatear con usuarios de otras empresas'
      );
    }

    this.logger.log(
      `✅ Validación de empresa exitosa: ${currentUser.company.legal_name}`
    );

    // Verificar si ya existe un chat directo entre estos usuarios
    const existingChat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoin('chat.participants', 'p1')
      .leftJoin('chat.participants', 'p2')
      .where('chat.type = :type', { type: ChatType.DIRECT })
      .andWhere('p1.user_id = :userId', { userId })
      .andWhere('p2.user_id = :otherUserId', { otherUserId })
      .andWhere('p1.is_active = :active', { active: true })
      .andWhere('p2.is_active = :active', { active: true })
      .getOne();

    if (existingChat) {
      return existingChat;
    }

    // Crear el chat directo
    const newChat = this.chatRepository.create({
      type: ChatType.DIRECT,
      created_by: userId
    });

    const savedChat = await this.chatRepository.save(newChat);

    // Agregar ambos usuarios como participantes
    const participants = [
      this.participantRepository.create({
        chat_id: savedChat.id,
        user_id: userId,
        role: ParticipantRole.MEMBER
      }),
      this.participantRepository.create({
        chat_id: savedChat.id,
        user_id: otherUserId,
        role: ParticipantRole.MEMBER
      })
    ];

    await this.participantRepository.save(participants);

    // Cargar el chat con relaciones
    const chatWithRelations = await this.chatRepository.findOne({
      where: { id: savedChat.id },
      relations: ['participants', 'participants.user', 'creator']
    });

    if (!chatWithRelations) {
      throw new NotFoundException('Chat no encontrado');
    }

    return chatWithRelations;
  }

  // 💬 Enviar mensaje
  async sendMessage(
    userId: string,
    chatId: string,
    sendMessageDto: SendMessageDto
  ): Promise<Message> {
    this.logger.log(
      `💬 Enviando mensaje en chat ${chatId} por usuario ${userId}`
    );

    // ✅ VALIDAR ACCESO POR EMPRESA
    await this.validateUserCompanyAccess(chatId, userId);

    // Crear el mensaje
    const newMessage = this.messageRepository.create({
      content: sendMessageDto.content,
      type: sendMessageDto.type || MessageType.TEXT,
      chat_id: chatId,
      sender_id: userId,
      file_url: sendMessageDto.file_url,
      file_name: sendMessageDto.file_name,
      file_type: sendMessageDto.file_type,
      file_size: sendMessageDto.file_size,
      reply_to_id: sendMessageDto.reply_to_id
    });

    const savedMessage = await this.messageRepository.save(newMessage);

    // Actualizar timestamp de última lectura del remitente
    await this.participantRepository.update(
      { chat_id: chatId, user_id: userId },
      { last_read_at: new Date() }
    );

    // Cargar el mensaje con relaciones
    const messageWithRelations = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'reply_to', 'reply_to.sender']
    });

    if (!messageWithRelations) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    return messageWithRelations;
  }

  // 👥 Obtener participantes de un chat
  async getChatParticipants(chatId: string) {
    return await this.participantRepository.find({
      where: { chat_id: chatId, is_active: true },
      relations: ['user']
    });
  }

  // 🏢 Validar que el usuario pertenece a la misma empresa que el chat
  private async validateUserCompanyAccess(
    chatId: string,
    userId: string
  ): Promise<void> {
    // Obtener el chat con sus participantes y empresas
    const chat = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'user')
      .leftJoinAndSelect('user.company', 'company')
      .where('chat.id = :chatId', { chatId })
      .getOne();

    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }

    // Obtener la empresa del usuario actual
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company']
    });

    if (!currentUser || !currentUser.company) {
      throw new ForbiddenException('Usuario sin empresa asignada');
    }

    // Verificar que todos los participantes pertenezcan a la misma empresa
    const participantsCompanies = chat.participants
      .map((p) => p.user.company?.id)
      .filter(Boolean);
    const uniqueCompanies = [...new Set(participantsCompanies)];

    if (
      uniqueCompanies.length > 1 ||
      !uniqueCompanies.includes(currentUser.company.id)
    ) {
      throw new ForbiddenException(
        'No tienes acceso a este chat (diferentes empresas)'
      );
    }

    this.logger.log(
      `✅ Validación de empresa exitosa para chat ${chatId} - Empresa: ${currentUser.company.legal_name}`
    );
  }

  // 📋 Obtener chats de un usuario (SOLO DE LA MISMA EMPRESA) - CORREGIDO
  async getUserChats(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    chats: Chat[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `📋 Obteniendo chats del usuario ${userId} (misma empresa)`
    );

    // Obtener la empresa del usuario actual
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company']
    });

    if (!currentUser || !currentUser.company) {
      throw new NotFoundException(
        'Usuario no encontrado o sin empresa asignada'
      );
    }

    // Obtener los IDs de chats donde el usuario participa
    const participantChats = await this.participantRepository
      .createQueryBuilder('participant')
      .select('participant.chat_id')
      .where('participant.user_id = :userId', { userId })
      .andWhere('participant.is_active = :isActive', { isActive: true })
      .getMany();

    const chatIds = participantChats.map((p) => p.chat_id);

    if (chatIds.length === 0) {
      return {
        chats: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }

    // Ahora obtener los chats con todas las relaciones
    const [chats, total] = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'user')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('chat.messages', 'message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('chat.id IN (:...chatIds)', { chatIds })
      .andWhere('chat.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('company.id = :companyId', {
        companyId: currentUser.company.id
      })
      .orderBy('chat.updated_at', 'DESC')
      .addOrderBy('message.created_at', 'ASC') // Ordenar mensajes por fecha
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    this.logger.log(
      `📋 Encontrados ${chats.length} chats de la empresa ${currentUser.company.legal_name}`
    );

    return {
      chats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // 💬 Obtener mensajes de un chat
  async getChatMessages(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: Message[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`💬 Obteniendo mensajes del chat ${chatId}`);

    // ✅ VALIDAR ACCESO POR EMPRESA
    await this.validateUserCompanyAccess(chatId, userId);

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { chat_id: chatId, is_deleted: false },
      relations: ['sender', 'reply_to', 'reply_to.sender'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Actualizar timestamp de última lectura
    await this.participantRepository.update(
      { chat_id: chatId, user_id: userId },
      { last_read_at: new Date() }
    );

    return {
      messages: messages.reverse(), // Mostrar mensajes más antiguos primero
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ✏️ Editar mensaje
  async editMessage(
    userId: string,
    messageId: string,
    content: string
  ): Promise<Message> {
    this.logger.log(`✏️ Editando mensaje ${messageId}`);

    const message = await this.messageRepository.findOne({
      where: { id: messageId, sender_id: userId, is_deleted: false }
    });

    if (!message) {
      throw new NotFoundException(
        'Mensaje no encontrado o no tienes permisos para editarlo'
      );
    }

    message.content = content;
    message.is_edited = true;

    return this.messageRepository.save(message);
  }

  // 🗑️ Eliminar mensaje
  async deleteMessage(userId: string, messageId: string): Promise<void> {
    this.logger.log(`🗑️ Eliminando mensaje ${messageId}`);

    const message = await this.messageRepository.findOne({
      where: { id: messageId, sender_id: userId, is_deleted: false }
    });

    if (!message) {
      throw new NotFoundException(
        'Mensaje no encontrado o no tienes permisos para eliminarlo'
      );
    }

    message.is_deleted = true;
    await this.messageRepository.save(message);
  }

  // 📋 Obtener chat específico (con validación de empresa)
  async getChat(chatId: string, userId: string): Promise<Chat> {
    this.logger.log(`📋 Obteniendo chat ${chatId} para usuario ${userId}`);

    // ✅ VALIDAR ACCESO POR EMPRESA
    await this.validateUserCompanyAccess(chatId, userId);

    const chat = await this.chatRepository.findOne({
      where: { id: chatId, is_deleted: false },
      relations: [
        'participants',
        'participants.user',
        'creator',
        'messages',
        'messages.sender'
      ]
    });

    if (!chat) {
      throw new NotFoundException('Chat no encontrado');
    }

    return chat;
  }
}
