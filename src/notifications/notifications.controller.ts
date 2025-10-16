import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ClerkAuthGuard } from '../auth/guards/clerk.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { CreateSimpleNotificationDto } from './dto/create-simple-notification.dto';

@ApiTags('Notificaciones')
@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(ClerkAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener notificaciones del usuario' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de notificaciones por página'
  })
  @ApiResponse({
    status: 200,
    description: 'Notificaciones obtenidas exitosamente',
    schema: {
      type: 'object',
      properties: {
        notifications: { type: 'array' },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  async getNotifications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: Request & { user: AuthenticatedUser }
  ) {
    const userId = req.user.id;
    return this.notificationsService.findAll(userId, page, limit);
  }

  @UseGuards(ClerkAuthGuard)
  @Post('mark-read/:id')
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      },
      required: ['userId']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación marcada como leída'
  })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async markAsRead(@Param('id') notificationId: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @UseGuards(ClerkAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar notificación' })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      },
      required: ['userId']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación eliminada exitosamente'
  })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async deleteNotification(
    @Param('id') notificationId: string,
    @Body('userId') userId: string
  ) {
    return this.notificationsService.remove(userId, notificationId);
  }

  @UseGuards(ClerkAuthGuard)
  @Post('mark-all-read')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      },
      required: ['userId']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Todas las notificaciones marcadas como leídas'
  })
  async markAllAsRead(@Body('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @UseGuards(ClerkAuthGuard)
  @Delete('delete-all')
  @ApiOperation({ summary: 'Eliminar todas las notificaciones' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      },
      required: ['userId']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Todas las notificaciones eliminadas'
  })
  async deleteAllNotifications(@Body('userId') userId: string) {
    return this.notificationsService.deleteAll(userId);
  }

  @UseGuards(ClerkAuthGuard)
  @Get('config')
  @ApiOperation({ summary: 'Obtener configuración de notificaciones' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      },
      required: ['userId']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración obtenida exitosamente'
  })
  async getNotificationConfig(@Body('userId') userId: string) {
    return this.notificationsService.getNotificationConfig(userId);
  }

  @UseGuards(ClerkAuthGuard)
  @Put('config')
  @ApiOperation({ summary: 'Actualizar configuración de notificaciones' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000'
        },
        email_notifications: { type: 'boolean', example: true },
        immediate_notifications: { type: 'boolean', example: true },
        employee_added: { type: 'boolean', example: true },
        payroll_processed: { type: 'boolean', example: true },
        productivity_report: { type: 'boolean', example: true },
        category_update: { type: 'boolean', example: true },
        evaluation_reminder: { type: 'boolean', example: true },
        holiday_reminder: { type: 'boolean', example: true },
        subscription_expiry: { type: 'boolean', example: true },
        birthday_reminder: { type: 'boolean', example: true },
        country: { type: 'string', example: 'AR' }
      },
      required: ['userId']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente'
  })
  async updateNotificationConfig(@Body() configData: any) {
    const { userId, ...config } = configData;
    return this.notificationsService.updateNotificationConfig(userId, config);
  }

  @UseGuards(ClerkAuthGuard)
  @Post('simple')
  @ApiOperation({
    summary: 'Crear notificación simple (formato frontend)',
    description:
      'Endpoint simplificado para crear notificaciones desde el frontend'
  })
  @ApiBody({ type: CreateSimpleNotificationDto })
  @ApiResponse({
    status: 201,
    description: 'Notificación creada exitosamente.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Notificación creada exitosamente'
        },
        notification: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-de-la-notificacion' },
            title: { type: 'string', example: 'Nuevo empleado registrado' },
            message: {
              type: 'string',
              example: 'Se agregó a Juan Pérez al sistema.'
            },
            type: { type: 'string', example: 'employee' },
            is_read: { type: 'boolean', example: false },
            created_at: { type: 'string', example: '2025-10-13T16:44:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async createSimpleNotification(
    @Body() createSimpleNotificationDto: CreateSimpleNotificationDto,
    @Req() req: Request
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    // Mapear el tipo simple al tipo del enum
    const typeMapping = {
      employee: 'employee_added',
      payroll: 'payroll_processed',
      productivity: 'productivity_report',
      category: 'category_update',
      evaluation: 'evaluation_reminder',
      holiday: 'holiday_reminder',
      subscription: 'subscription_updated',
      birthday: 'birthday_reminder',
      custom: 'custom_notification'
    };

    const mappedType =
      typeMapping[createSimpleNotificationDto.type] || 'custom_notification';

    const notification = await this.notificationsService.createNotification(
      userId,
      createSimpleNotificationDto.title,
      createSimpleNotificationDto.message,
      mappedType as any
    );

    return {
      message: 'Notificación creada exitosamente',
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: createSimpleNotificationDto.type, // Devolver el tipo original
        is_read: notification.is_read,
        created_at: notification.created_at
      }
    };
  }

  @UseGuards(ClerkAuthGuard)
  @Post('schedule-reminder')
  @ApiOperation({ summary: 'Agendar un recordatorio personalizado' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Reunión importante' },
        message: {
          type: 'string',
          example: 'No olvides la reunión de equipo a las 3 PM'
        },
        scheduledDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T15:00:00.000Z'
        },
        type: { type: 'string', example: 'custom_notification' }
      },
      required: ['title', 'message', 'scheduledDate']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Recordatorio agendado exitosamente.'
  })
  async scheduleReminder(
    @Req() req: Request & { user: AuthenticatedUser },
    @Body()
    body: {
      title: string;
      message: string;
      scheduledDate: string;
      type?: string;
    }
  ) {
    const userId = req.user.id;
    const scheduledDate = new Date(body.scheduledDate);

    return this.notificationsService.scheduleReminder(
      userId,
      body.title,
      body.message,
      scheduledDate,
      (body.type as any) || 'custom_notification'
    );
  }

  // -------------------------------
  // 🆕 NUEVOS ENDPOINTS AGREGADOS
  // -------------------------------

  @UseGuards(ClerkAuthGuard)
  @Get('cron-status')
  @ApiOperation({
    summary: 'Obtener el estado actual de los crons de notificaciones'
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actual de los crons retornado correctamente'
  })
  async getCronStatus() {
    return await this.notificationsService.getCronStatus();
  }

  @UseGuards(ClerkAuthGuard)
  @Get('cron-notifications')
  @ApiOperation({
    summary:
      'Obtener las notificaciones automáticas recientes generadas por los crons'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Límite de notificaciones a retornar (default: 20)'
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de notificaciones automáticas recientes retornada correctamente'
  })
  async getCronNotifications(@Query('limit') limit: number = 20) {
    return this.notificationsService.getRecentCronNotifications(limit);
  }
}
