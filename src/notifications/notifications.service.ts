import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { User } from '../user/entities/user.entity';
import { Company } from '../empresa/entities/empresa.entity';
import { Suscripcion } from '../suscripcion/entities/suscripcion.entity';
import { Employee } from '../empleado/entities/empleado.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationConfig } from './entities/notification-config.entity';
import { NotificationsGateway } from './notifications.gateway';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto';
import { SENDGRID_API_KEY, SENDGRID_FROM } from '../config/envs';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly fromEmail: string;

  /**
   * Estado simple para que el frontend consulte cuándo corrió cada cron por última vez
   * y si la última ejecución fue OK o falló.
   */
  private cronStatus: Record<
    string,
    {
      lastRun: Date | null;
      status: 'success' | 'error' | 'never';
      errorMessage?: string;
    }
  > = {
    checkExpiringSubscriptions: { lastRun: null, status: 'never' },
    checkExpiredSubscriptions: { lastRun: null, status: 'never' },
    checkBirthdays: { lastRun: null, status: 'never' },
    checkHolidays: { lastRun: null, status: 'never' }
  };

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Suscripcion)
    private suscripcionRepository: Repository<Suscripcion>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationConfig)
    private configRepository: Repository<NotificationConfig>,
    private notificationsGateway: NotificationsGateway,
    private configService: ConfigService
  ) {
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    if (!SENDGRID_API_KEY) {
      this.logger.warn(
        'SENDGRID_API_KEY not found. Email functionality will be disabled.'
      );
      return;
    }
    sgMail.setApiKey(SENDGRID_API_KEY);
    this.logger.log('SendGrid initialized successfully');
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ) {
    try {
      const msg = {
        to,
        from: SENDGRID_FROM || 'noreply@tuempresa.com',
        subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Convert HTML to plain text
        html
      };

      await sgMail.send(msg);
      this.logger.log(`📧 Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  // -----------------------
  // Helpers para cron status
  // -----------------------
  private updateCronStatus(
    name: string,
    status: 'success' | 'error',
    errorMessage?: string
  ) {
    this.cronStatus[name] = {
      lastRun: new Date(),
      status,
      errorMessage
    };
  }

  getCronStatus() {
    return this.cronStatus;
  }

  // Devuelve notificaciones recientes generadas por crons (filtramos por tipos automáticos)
  async getRecentCronNotifications(limit = 20) {
    const automaticTypes: NotificationType[] = [
      'subscription_expiring' as NotificationType,
      'subscription_expired' as NotificationType,
      'birthday_reminder' as NotificationType,
      'holiday_reminder' as NotificationType,
      'evaluation_reminder' as NotificationType
    ];

    return this.notificationRepository.find({
      where: { type: automaticTypes as any, is_deleted: false },
      order: { created_at: 'DESC' },
      take: limit
    });
  }

  // 🔔 CRON: Verificar suscripciones que expiran en 7 días
  @Cron('0 9 * * *') // Todos los días a las 9:00 AM
  async checkExpiringSubscriptions() {
    const cronName = 'checkExpiringSubscriptions';
    this.logger.log('🔍 Verificando suscripciones que expiran en 7 días...');
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringSubscriptions = await this.suscripcionRepository
        .createQueryBuilder('suscripcion')
        .leftJoinAndSelect('suscripcion.company', 'company')
        .leftJoinAndSelect('suscripcion.plan', 'plan')
        .where('DATE(suscripcion.end_date) = DATE(:sevenDaysFromNow)', {
          sevenDaysFromNow
        })
        .getMany();

      for (const subscription of expiringSubscriptions) {
        await this.sendSubscriptionExpiryNotification(subscription);
      }

      this.logger.log(
        `📧 Enviadas ${expiringSubscriptions.length} notificaciones de expiración`
      );
      this.updateCronStatus(cronName, 'success');
    } catch (error) {
      this.logger.error('❌ Error en checkExpiringSubscriptions:', error);
      this.updateCronStatus(cronName, 'error', String(error));
    }
  }

  // 🔔 CRON: Verificar suscripciones expiradas
  @Cron('0 10 * * *') // Todos los días a las 10:00 AM
  async checkExpiredSubscriptions() {
    const cronName = 'checkExpiredSubscriptions';
    this.logger.log('🔍 Verificando suscripciones expiradas...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredSubscriptions = await this.suscripcionRepository
        .createQueryBuilder('suscripcion')
        .leftJoinAndSelect('suscripcion.company', 'company')
        .leftJoinAndSelect('suscripcion.plan', 'plan')
        .where('DATE(suscripcion.end_date) < DATE(:today)', { today })
        .getMany();

      for (const subscription of expiredSubscriptions) {
        await this.sendSubscriptionExpiredNotification(subscription);
      }

      this.logger.log(
        `📧 Enviadas ${expiredSubscriptions.length} notificaciones de expiración`
      );
      this.updateCronStatus(cronName, 'success');
    } catch (error) {
      this.logger.error('❌ Error en checkExpiredSubscriptions:', error);
      this.updateCronStatus(cronName, 'error', String(error));
    }
  }

  // 🔔 CRON: Recordatorio de cumpleaños
  @Cron('0 8 * * *') // Todos los días a las 8:00 AM
  async checkBirthdays() {
    const cronName = 'checkBirthdays';
    this.logger.log('🎂 Verificando cumpleaños de empleados...');
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      const birthdayEmployees = await this.employeeRepository
        .createQueryBuilder('employee')
        .leftJoinAndSelect('employee.company', 'company')
        .where('EXTRACT(MONTH FROM employee.birthdate) = :month', { month })
        .andWhere('EXTRACT(DAY FROM employee.birthdate) = :day', { day })
        .getMany();

      for (const employee of birthdayEmployees) {
        await this.sendBirthdayNotification(employee);
      }

      this.logger.log(
        `🎉 Enviadas ${birthdayEmployees.length} notificaciones de cumpleaños`
      );
      this.updateCronStatus(cronName, 'success');
    } catch (error) {
      this.logger.error('❌ Error en checkBirthdays:', error);
      this.updateCronStatus(cronName, 'error', String(error));
    }
  }

  // 🔔 CRON: Recordatorios de feriados
  @Cron('0 7 * * *') // Todos los días a las 7:00 AM
  async checkHolidays() {
    const cronName = 'checkHolidays';
    this.logger.log('🎊 Verificando feriados...');

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Obtener todas las empresas con sus configuraciones
      const companies = await this.companyRepository.find();

      for (const company of companies) {
        await this.checkCompanyHolidays(company, tomorrow);
      }

      this.updateCronStatus(cronName, 'success');
    } catch (error) {
      this.logger.error('❌ Error en checkHolidays:', error);
      this.updateCronStatus(cronName, 'error', String(error));
    }
  }

  // 🔔 MÉTODOS PÚBLICOS PARA EVENTOS EN TIEMPO REAL

  // 👤 Notificar empleado agregado
  async notifyEmployeeAdded(
    companyId: string,
    employeeName: string,
    position?: string
  ) {
    this.logger.log(`👤 Notificando empleado agregado: ${employeeName}`);

    try {
      // Obtener usuarios de la empresa
      const users = await this.userRepository.find({
        where: { company: { id: companyId } },
        relations: ['company']
      });

      if (users.length === 0) {
        this.logger.warn(
          `⚠️ No se encontraron usuarios para la empresa ${companyId}`
        );
        return;
      }

      // Crear notificación para cada usuario de la empresa
      for (const user of users) {
        await this.createNotification(
          user.id,
          '👤 Nuevo empleado agregado',
          `Se agregó ${employeeName}${position ? ` como ${position}` : ''} al equipo`,
          'employee_added' as NotificationType
        );
      }
    } catch (error) {
      this.logger.error(`Error enviando notificación: ${error.message}`);
    }
  }

  // 🚫 Notificar ausencia agregada
  async notifyAbsenceAdded(
    companyId: string,
    employeeName: string,
    startDate: Date,
    endDate: Date,
    description?: string
  ) {
    this.logger.log(`🚫 Notificando ausencia agregada: ${employeeName}`);

    try {
      // Obtener usuarios de la empresa
      const users = await this.userRepository.find({
        where: { company: { id: companyId } },
        relations: ['company']
      });

      if (users.length === 0) {
        this.logger.warn(
          `⚠️ No se encontraron usuarios para la empresa ${companyId}`
        );
        return;
      }

      const startDateStr = startDate.toLocaleDateString();
      const endDateStr = endDate.toLocaleDateString();
      const dateRange =
        startDateStr === endDateStr
          ? startDateStr
          : `${startDateStr} - ${endDateStr}`;

      // Crear notificación para cada usuario de la empresa
      for (const user of users) {
        await this.createNotification(
          user.id,
          '🚫 Nueva ausencia registrada',
          `Se registró una ausencia para ${employeeName} del ${dateRange}${description ? `: ${description}` : ''}`,
          'absence_added' as NotificationType
        );
      }
    } catch (error) {
      this.logger.error(
        `Error enviando notificación de ausencia: ${error.message}`
      );
    }
  }

  // 💰 Notificar nómina procesada
  async notifyPayrollProcessed(
    companyId: string,
    period: string,
    totalEmployees: number
  ) {
    this.logger.log(`💰 Notificando nómina procesada para período: ${period}`);

    await this.createNotification(
      companyId,
      '💰 Nómina procesada',
      `La nómina del período ${period} ha sido procesada para ${totalEmployees} empleados`,
      'payroll_processed' as NotificationType
    );
  }

  // 📊 Notificar reporte de productividad
  async notifyProductivityReport(
    companyId: string,
    reportType: string,
    period: string
  ) {
    this.logger.log(`📊 Notificando reporte de productividad: ${reportType}`);

    await this.createNotification(
      companyId,
      '📊 Reporte de productividad disponible',
      `El reporte de ${reportType} para el período ${period} está listo para revisión`,
      'productivity_report' as NotificationType
    );
  }

  // 📝 Notificar actualización de categoría
  async notifyCategoryUpdate(
    companyId: string,
    categoryName: string,
    action: string
  ) {
    this.logger.log(
      `📝 Notificando actualización de categoría: ${categoryName}`
    );

    await this.createNotification(
      companyId,
      '📝 Categoría actualizada',
      `La categoría ${categoryName} ha sido ${action}`,
      'category_update' as NotificationType
    );
  }

  // 📋 Notificar recordatorio de evaluación
  async notifyEvaluationReminder(
    companyId: string,
    employeeName: string,
    evaluationType: string
  ) {
    this.logger.log(
      `📋 Notificando recordatorio de evaluación: ${employeeName}`
    );

    await this.createNotification(
      companyId,
      '📋 Recordatorio de evaluación',
      `Es hora de realizar la evaluación ${evaluationType} de ${employeeName}`,
      'evaluation_reminder' as NotificationType
    );
  }

  // 📅 Agendar recordatorio personalizado
  async scheduleReminder(
    userId: string,
    title: string,
    message: string,
    scheduledDate: Date,
    type: NotificationType = 'custom_notification' as NotificationType
  ) {
    this.logger.log(
      `📅 Agendando recordatorio para ${scheduledDate.toISOString()}`
    );

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Crear notificación programada
    const notification = this.notificationRepository.create({
      title,
      message,
      type,
      user,
      is_read: false,
      is_deleted: false
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    this.logger.log(
      `✅ Recordatorio agendado: ${title} para ${scheduledDate.toLocaleString()}`
    );

    return savedNotification;
  }

  // 📧 Enviar notificación de suscripción por expirar
  private async sendSubscriptionExpiryNotification(subscription: Suscripcion) {
    const company = subscription.company;
    const plan = subscription.plan;

    // Crear notificación en BD
    await this.createNotification(
      company.id,
      '⚠️ Suscripción por expirar',
      `Tu suscripción al plan ${plan.name} expira en 7 días`,
      'subscription_expiring' as NotificationType
    );

    // Enviar email
    const subject = `⚠️ Tu suscripción ${plan.name} expira en 7 días`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">⚠️ Recordatorio de Expiración</h2>
        <p>Hola <strong>${company.legal_name}</strong>,</p>
        <p>Te informamos que tu suscripción al plan <strong>${plan.name}</strong> expirará en <strong>7 días</strong>.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalles de tu suscripción:</h3>
          <ul>
            <li><strong>Plan:</strong> ${plan.name}</li>
            <li><strong>Precio:</strong> $${plan.price}</li>
            <li><strong>Fecha de expiración:</strong> ${subscription.end_date.toLocaleDateString()}</li>
          </ul>
        </div>
        <p>Para renovar tu suscripción, por favor contacta con nuestro equipo de soporte.</p>
        <p>Saludos,<br>Equipo HR System</p>
      </div>
    `;

    try {
      await this.sendEmail(company.email, subject, html);
      this.logger.log(
        `📧 Notificación de expiración enviada a ${company.email}`
      );
    } catch (error) {
      this.logger.error(
        `❌ Error enviando notificación a ${company.email}:`,
        error
      );
    }
  }

  // 📧 Enviar notificación de suscripción expirada
  private async sendSubscriptionExpiredNotification(subscription: Suscripcion) {
    const company = subscription.company;
    const plan = subscription.plan;

    // Crear notificación en BD
    await this.createNotification(
      company.id,
      '🚫 Suscripción expirada',
      `Tu suscripción al plan ${plan.name} ha expirado`,
      'subscription_expired' as NotificationType
    );

    // Enviar email
    const subject = `🚫 Tu suscripción ${plan.name} ha expirado`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">🚫 Suscripción Expirada</h2>
        <p>Hola <strong>${company.legal_name}</strong>,</p>
        <p>Tu suscripción al plan <strong>${plan.name}</strong> ha expirado el <strong>${subscription.end_date.toLocaleDateString()}</strong>.</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>⚠️ Acceso Limitado</h3>
          <p>Algunas funcionalidades pueden estar limitadas hasta que renueves tu suscripción.</p>
        </div>
        <p>Para renovar y continuar disfrutando de todos nuestros servicios, contacta con nuestro equipo.</p>
        <p>Saludos,<br>Equipo HR System</p>
      </div>
    `;

    try {
      await this.sendEmail(company.email, subject, html);
      this.logger.log(
        `📧 Notificación de expiración enviada a ${company.email}`
      );
    } catch (error) {
      this.logger.error(
        `❌ Error enviando notificación a ${company.email}:`,
        error
      );
    }
  }

  // 🎂 Enviar notificación de cumpleaños
  private async sendBirthdayNotification(employee: Employee) {
    const company = employee.company;

    // Crear notificación en BD
    await this.createNotification(
      company.id,
      '🎉 ¡Feliz cumpleaños!',
      `Hoy es el cumpleaños de ${employee.first_name} ${employee.last_name}`,
      'birthday_reminder' as NotificationType
    );

    // Enviar email
    const subject = `🎉 ¡Feliz cumpleaños ${employee.first_name}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e91e63;">🎉 ¡Feliz Cumpleaños!</h2>
        <p>Hola <strong>${company.legal_name}</strong>,</p>
        <p>¡Hoy es el cumpleaños de <strong>${employee.first_name} ${employee.last_name}</strong>! 🎂</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>🎁 Detalles del empleado:</h3>
          <ul>
            <li><strong>Nombre:</strong> ${employee.first_name} ${employee.last_name}</li>
            <li><strong>Email:</strong> ${employee.email}</li>
            <li><strong>Fecha de nacimiento:</strong> ${employee.birthdate?.toLocaleDateString?.() || 'N/A'}</li>
          </ul>
        </div>
        <p>¡No olvides felicitarlo y hacer que se sienta especial en su día! 🎈</p>
        <p>Saludos,<br>Equipo HR System</p>
      </div>
    `;

    try {
      await this.sendEmail(company.email, subject, html);
      this.logger.log(
        `🎂 Notificación de cumpleaños enviada para ${employee.first_name} ${employee.last_name}`
      );
    } catch (error) {
      this.logger.error(`❌ Error enviando notificación de cumpleaños:`, error);
    }
  }

  // 🎊 Verificar feriados por país usando API
  private async checkCompanyHolidays(company: Company, date: Date) {
    try {
      // Obtener el país de la empresa (por defecto AR si no está configurado)
      const countryCode = 'AR'; // company.country || 'AR'

      // Consultar API de feriados
      const isHoliday = await this.checkHolidayAPI(countryCode, date);

      if (isHoliday.isHoliday) {
        this.logger.log(
          `🎊 ${date.toDateString()} es feriado en ${countryCode}: ${isHoliday.name}`
        );

        // Crear notificación en BD
        await this.createNotification(
          company.id,
          '🎊 Recordatorio de feriado',
          `Mañana es feriado: ${isHoliday.name}`,
          'holiday_reminder' as NotificationType
        );

        // Enviar email
        const subject = `🎊 Recordatorio de feriado: ${isHoliday.name}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f39c12;">🎊 Recordatorio de Feriado</h2>
            <p>Hola <strong>${company.legal_name}</strong>,</p>
            <p>Te recordamos que <strong>mañana es feriado</strong>: <strong>${isHoliday.name}</strong></p>
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h3>📅 Información del feriado:</h3>
              <ul>
                <li><strong>Fecha:</strong> ${date.toLocaleDateString()}</li>
                <li><strong>Feriado:</strong> ${isHoliday.name}</li>
                <li><strong>País:</strong> ${countryCode}</li>
              </ul>
            </div>
            <p>¡Que tengas un excelente día libre! 🎉</p>
            <p>Saludos,<br>Equipo HR System</p>
          </div>
        `;

        try {
          await this.sendEmail(company.email, subject, html);
          this.logger.log(
            `🎊 Notificación de feriado enviada a ${company.email}`
          );
        } catch (error) {
          this.logger.error(
            `❌ Error enviando notificación de feriado:`,
            error
          );
        }
      } else {
        this.logger.log(
          `📅 ${date.toDateString()} no es feriado en ${countryCode}`
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error verificando feriados para ${company.legal_name}:`,
        error
      );
    }
  }

  // 🌐 Consultar API de feriados
  private async checkHolidayAPI(
    countryCode: string,
    date: Date
  ): Promise<{ isHoliday: boolean; name?: string }> {
    try {
      // Usar una API gratuita de feriados (ejemplo: holidayapi.com o similar)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      // URL de ejemplo para una API de feriados (reemplazar con API real)
      const apiUrl = `https://date.nager.at/api/v3/IsPublicHoliday/${year}-${month}-${day}/${countryCode}`;

      const response = await fetch(apiUrl);
      const isHoliday = await response.json();

      if (isHoliday) {
        // Si es feriado, obtener el nombre del feriado
        const holidayInfoUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
        const holidayResponse = await fetch(holidayInfoUrl);
        const holidays = await holidayResponse.json();

        const holiday = holidays.find((h: any) => {
          const holidayDate = new Date(h.date);
          return (
            holidayDate.getDate() === date.getDate() &&
            holidayDate.getMonth() === date.getMonth()
          );
        });

        return {
          isHoliday: true,
          name: holiday ? holiday.name : 'Feriado'
        };
      }

      return { isHoliday: false };
    } catch (error) {
      this.logger.error(
        `❌ Error consultando API de feriados: ${error.message}`
      );

      // Si la API falla, asumir que no es feriado para evitar notificaciones incorrectas
      return { isHoliday: false };
    }
  }

  // Crear notificación en BD
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(
        `⚠️ Usuario ${userId} no encontrado para notificación: ${title}`
      );
      return null; // Retornar null en lugar de lanzar error
    }

    const notification = this.notificationRepository.create({
      title,
      message,
      type,
      user,
      is_read: false,
      is_deleted: false
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Enviar notificación en tiempo real
    await this.notificationsGateway.sendNotificationToUser(
      userId,
      savedNotification
    );

    return savedNotification;
  }

  // Obtener notificaciones de un usuario
  async findAll(userId: string, page: number = 1, limit: number = 10) {
    try {
      const [notifications, total] =
        await this.notificationRepository.findAndCount({
          where: { user_id: userId, is_deleted: false },
          order: { created_at: 'DESC' },
          skip: (page - 1) * limit,
          take: limit
        });

      return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  }

  // Marcar notificación como leída
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user_id: userId }
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    notification.is_read = true;
    return await this.notificationRepository.save(notification);
  }

  // Eliminar notificación
  async remove(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user_id: userId }
    });

    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    notification.is_deleted = true;
    return await this.notificationRepository.save(notification);
  }

  // Marcar todas como leídas
  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true }
    );
  }

  // Eliminar todas las notificaciones
  async deleteAll(userId: string) {
    await this.notificationRepository.update(
      { user_id: userId, is_deleted: false },
      { is_deleted: true }
    );
  }

  // Obtener configuración de notificaciones
  async getNotificationConfig(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let config = await this.configRepository.findOne({
      where: { user_id: userId }
    });

    if (!config) {
      config = this.configRepository.create({
        user_id: userId,
        email_notifications: true,
        immediate_notifications: true,
        country: 'AR'
      });
      config = await this.configRepository.save(config);
    }

    return config;
  }

  // Actualizar configuración de notificaciones
  async updateNotificationConfig(
    userId: string,
    configData: UpdateNotificationConfigDto
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let config = await this.configRepository.findOne({
      where: { user_id: userId }
    });

    if (!config) {
      config = this.configRepository.create({ user_id: userId });
    }

    Object.assign(config, configData);
    return await this.configRepository.save(config);
  }
}
