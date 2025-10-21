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
import { ScheduleReminderDto } from './dto/schedule-reminder.dto';
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

@ApiTags('Notificaciones')
@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

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
  async markAsRead(
    @Param('id') notificationId: string,
    @Body('userId') userId: string
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

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

  @Post('create')
  @ApiOperation({ summary: 'Crear una notificación manual (para testing)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Notificación de prueba' },
        message: {
          type: 'string',
          example: 'Esta es una notificación de prueba'
        },
        type: {
          type: 'string',
          enum: [
            'employee_added',
            'payroll_processed',
            'productivity_report',
            'category_update',
            'evaluation_reminder',
            'holiday_reminder',
            'subscription_expiring',
            'subscription_expired',
            'birthday_reminder',
            'custom_notification'
          ],
          example: 'custom_notification'
        },
        userId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000'
        }
      },
      required: ['title', 'message', 'type', 'userId']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Notificación creada exitosamente.'
  })
  async createNotification(
    @Body()
    body: {
      title: string;
      message: string;
      type: string;
      userId: string;
    }
  ) {
    return this.notificationsService.createNotification(
      body.userId,
      body.title,
      body.message,
      body.type as any
    );
  }

  @Post('schedule-reminder')
  @ApiOperation({ summary: 'Agendar un recordatorio personalizado' })
  @ApiResponse({
    status: 201,
    description: 'Recordatorio agendado exitosamente.'
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos - La fecha debe ser futura'
  })
  async scheduleReminder(
    @Req() req: Request & { user: AuthenticatedUser },
    @Body() scheduleReminderDto: ScheduleReminderDto
  ) {
    const userId = req.user.id;
    const scheduledDate = new Date(scheduleReminderDto.scheduledDate);

    return this.notificationsService.scheduleReminder(
      userId,
      scheduleReminderDto.title,
      scheduleReminderDto.message,
      scheduledDate,
      (scheduleReminderDto.type as any) || 'custom_notification',
      scheduleReminderDto.recipientType || ('all' as any),
      scheduleReminderDto.recipientEmails,
      scheduleReminderDto.recipientEmployeeIds
    );
  }

  // -------------------------------
  // 🆕 NUEVOS ENDPOINTS AGREGADOS
  // -------------------------------

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

  // -------------------------------
  // 📅 ENDPOINTS PARA RECORDATORIOS PROGRAMADOS
  // -------------------------------

  @Get('scheduled')
  @ApiOperation({ summary: 'Obtener recordatorios programados del usuario' })
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
    description: 'Límite de recordatorios por página'
  })
  @ApiResponse({
    status: 200,
    description: 'Recordatorios programados obtenidos exitosamente'
  })
  async getScheduledReminders(
    @Req() req: Request & { user: AuthenticatedUser },
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const userId = req.user.id;
    return this.notificationsService.getScheduledReminders(userId, page, limit);
  }

  @Get('scheduled/:id')
  @ApiOperation({ summary: 'Obtener un recordatorio programado específico' })
  @ApiParam({ name: 'id', description: 'ID del recordatorio programado' })
  @ApiResponse({
    status: 200,
    description: 'Recordatorio programado obtenido exitosamente'
  })
  @ApiResponse({ status: 404, description: 'Recordatorio no encontrado' })
  async getScheduledReminder(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('id') id: string
  ) {
    const userId = req.user.id;
    return this.notificationsService.getScheduledReminder(userId, id);
  }

  @Delete('scheduled/:id')
  @ApiOperation({ summary: 'Cancelar un recordatorio programado' })
  @ApiParam({ name: 'id', description: 'ID del recordatorio programado' })
  @ApiResponse({
    status: 200,
    description: 'Recordatorio cancelado exitosamente'
  })
  @ApiResponse({ status: 404, description: 'Recordatorio no encontrado' })
  async cancelScheduledReminder(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('id') id: string
  ) {
    const userId = req.user.id;
    return this.notificationsService.cancelScheduledReminder(userId, id);
  }

  @Put('scheduled/:id')
  @ApiOperation({ summary: 'Actualizar un recordatorio programado' })
  @ApiParam({ name: 'id', description: 'ID del recordatorio programado' })
  @ApiBody({ type: ScheduleReminderDto })
  @ApiResponse({
    status: 200,
    description: 'Recordatorio actualizado exitosamente'
  })
  @ApiResponse({ status: 404, description: 'Recordatorio no encontrado' })
  async updateScheduledReminder(
    @Req() req: Request & { user: AuthenticatedUser },
    @Param('id') id: string,
    @Body() scheduleReminderDto: ScheduleReminderDto
  ) {
    const userId = req.user.id;
    const scheduledDate = new Date(scheduleReminderDto.scheduledDate);

    return this.notificationsService.updateScheduledReminder(
      userId,
      id,
      scheduleReminderDto.title,
      scheduleReminderDto.message,
      scheduledDate,
      scheduleReminderDto.recipientType || ('all' as any),
      scheduleReminderDto.recipientEmails,
      scheduleReminderDto.recipientEmployeeIds
    );
  }

  // -------------------------------
  // 🎊 ENDPOINTS PARA FERIADOS
  // -------------------------------

  @Get('holidays/:country/:year')
  @ApiOperation({
    summary: 'Obtener feriados de un país para un año específico'
  })
  @ApiParam({
    name: 'country',
    description: 'Código del país (ej: AR, US, BR)'
  })
  @ApiParam({ name: 'year', description: 'Año para consultar feriados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de feriados obtenida exitosamente'
  })
  async getHolidays(
    @Param('country') country: string,
    @Param('year') year: number
  ) {
    return this.notificationsService.getHolidaysForCountry(country, year);
  }

  @Get('holidays/check/:date/:country')
  @ApiOperation({ summary: 'Verificar si una fecha específica es feriado' })
  @ApiParam({ name: 'date', description: 'Fecha a verificar (YYYY-MM-DD)' })
  @ApiParam({ name: 'country', description: 'Código del país' })
  @ApiResponse({
    status: 200,
    description: 'Información del feriado obtenida exitosamente'
  })
  async checkHoliday(
    @Param('date') date: string,
    @Param('country') country: string
  ) {
    const checkDate = new Date(date);
    return this.notificationsService.checkHolidayForDate(country, checkDate);
  }
}
