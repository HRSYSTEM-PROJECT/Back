import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { User } from '../user/entities/user.entity';
import { Company } from '../empresa/entities/empresa.entity';
import { Suscripcion } from '../suscripcion/entities/suscripcion.entity';
import { Employee } from '../empleado/entities/empleado.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationConfig } from './entities/notification-config.entity';
import {
  ScheduledNotification,
  RecipientType
} from './entities/scheduled-notification.entity';
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
    @InjectRepository(ScheduledNotification)
    private scheduledNotificationRepository: Repository<ScheduledNotification>,
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
      NotificationType.SUBSCRIPTION_EXPIRING,
      NotificationType.SUBSCRIPTION_EXPIRED,
      NotificationType.BIRTHDAY_REMINDER,
      NotificationType.HOLIDAY_REMINDER,
      NotificationType.EVALUATION_REMINDER
    ];

    return this.notificationRepository.find({
      where: { type: In(automaticTypes), is_deleted: false },
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

  // 🔔 CRON: Ejecutar notificaciones programadas
  @Cron('*/15 * * * *') // Cada 15 minutos
  async executeScheduledNotifications() {
    const cronName = 'executeScheduledNotifications';
    this.logger.log(
      `🕐 Ejecutando verificación de notificaciones programadas...`
    );

    try {
      const now = new Date();
      const oneMinuteFromNow = new Date(now.getTime() + 60000);

      // Buscar notificaciones programadas que deben ejecutarse
      const scheduledNotifications = await this.scheduledNotificationRepository
        .createQueryBuilder('scheduled')
        .where('scheduled.is_executed = :executed', { executed: false })
        .andWhere('scheduled.is_deleted = :deleted', { deleted: false })
        .andWhere('scheduled.scheduled_date >= :now', { now })
        .andWhere('scheduled.scheduled_date <= :oneMinuteFromNow', {
          oneMinuteFromNow
        })
        .getMany();

      this.logger.log(
        `📋 Encontradas ${scheduledNotifications.length} notificaciones programadas para ejecutar`
      );

      for (const scheduledNotification of scheduledNotifications) {
        await this.executeScheduledNotification(scheduledNotification);
      }

      this.updateCronStatus(cronName, 'success');
    } catch (error) {
      this.logger.error(
        `❌ Error ejecutando notificaciones programadas:`,
        error
      );
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
  @Cron('*/15 * * * *') // Cada 15 minutos
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
  @Cron('*/15 * * * *') // Cada 15 minutos
  async checkHolidays() {
    const cronName = 'checkHolidays';
    this.logger.log('🎊 Verificando feriados...');

    try {
      const today = new Date();

      // Obtener todas las empresas con sus configuraciones
      const companies = await this.companyRepository.find();

      for (const company of companies) {
        await this.checkCompanyHolidays(company, today);
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
    type: NotificationType = 'custom_notification' as NotificationType,
    recipientType: RecipientType = RecipientType.ALL,
    recipientEmails?: string[],
    recipientEmployeeIds?: string[]
  ) {
    this.logger.log(
      `📅 Agendando recordatorio para ${scheduledDate.toISOString()}`
    );

    // Validar fecha futura y usuario
    this.validateFutureDate(scheduledDate);
    const user = await this.findUserById(userId);

    // Crear notificación programada
    const scheduledNotification = new ScheduledNotification();

    scheduledNotification.title = title;
    scheduledNotification.message = message;
    scheduledNotification.recipient_type = recipientType;
    scheduledNotification.recipient_emails = recipientEmails
      ? JSON.stringify(recipientEmails)
      : null;
    scheduledNotification.recipient_employee_ids = recipientEmployeeIds
      ? JSON.stringify(recipientEmployeeIds)
      : null;
    scheduledNotification.scheduled_date = scheduledDate;
    scheduledNotification.is_executed = false;
    scheduledNotification.email_sent = false;
    scheduledNotification.is_deleted = false;
    scheduledNotification.created_by = userId;

    const savedScheduledNotification =
      await this.scheduledNotificationRepository.save(scheduledNotification);

    this.logger.log(
      `✅ Recordatorio agendado: ${title} para ${scheduledDate.toLocaleString()}`
    );

    return savedScheduledNotification;
  }

  // 🔔 Ejecutar notificación programada
  private async executeScheduledNotification(
    scheduledNotification: ScheduledNotification
  ) {
    try {
      this.logger.log(
        `🚀 Ejecutando notificación programada: ${scheduledNotification.title}`
      );

      // Obtener destinatarios
      const recipients = await this.getRecipients(scheduledNotification);

      // Crear notificaciones para cada destinatario
      for (const recipient of recipients) {
        await this.createNotification(
          recipient.id,
          scheduledNotification.title,
          scheduledNotification.message,
          'custom_notification' as NotificationType
        );
      }

      // Enviar emails si hay destinatarios
      if (recipients.length > 0) {
        await this.sendScheduledNotificationEmails(
          scheduledNotification,
          recipients
        );
      }

      // Marcar como ejecutada
      await this.scheduledNotificationRepository.update(
        scheduledNotification.id,
        {
          is_executed: true,
          executed_at: new Date()
        }
      );

      this.logger.log(
        `✅ Notificación programada ejecutada: ${scheduledNotification.title}`
      );
    } catch (error) {
      this.logger.error(`❌ Error ejecutando notificación programada:`, error);
    }
  }

  // 📧 Obtener destinatarios según el tipo
  private async getRecipients(
    scheduledNotification: ScheduledNotification
  ): Promise<User[]> {
    const recipients: User[] = [];

    switch (scheduledNotification.recipient_type) {
      case RecipientType.ALL:
        // Todos los usuarios de la empresa del creador
        const creator = await this.userRepository.findOne({
          where: { id: scheduledNotification.created_by },
          relations: ['company']
        });

        if (creator?.company) {
          const allUsers = await this.userRepository.find({
            where: { company: { id: creator.company.id } }
          });
          recipients.push(...allUsers);
        }
        break;

      case RecipientType.EMPLOYEES:
        // Empleados específicos
        if (scheduledNotification.recipient_employee_ids) {
          const employeeIds = JSON.parse(
            scheduledNotification.recipient_employee_ids
          );
          const employees = await this.employeeRepository
            .createQueryBuilder('employee')
            .leftJoinAndSelect('employee.user', 'user')
            .where('employee.id IN (:...employeeIds)', { employeeIds })
            .getMany();

          for (const employee of employees) {
            if (employee.user) {
              recipients.push(employee.user);
            }
          }
        }
        break;

      case RecipientType.SPECIFIC:
        // Emails específicos - crear usuarios temporales o buscar por email
        if (scheduledNotification.recipient_emails) {
          const emails = JSON.parse(scheduledNotification.recipient_emails);
          const users = await this.userRepository
            .createQueryBuilder('user')
            .where('user.email IN (:...emails)', { emails })
            .getMany();
          recipients.push(...users);
        }
        break;
    }

    return recipients;
  }

  // 📧 Enviar emails de notificación programada
  private async sendScheduledNotificationEmails(
    scheduledNotification: ScheduledNotification,
    recipients: User[]
  ) {
    try {
      const emails = recipients
        .map((user) => user.email)
        .filter((email) => email);

      if (emails.length === 0) {
        this.logger.warn('No hay emails válidos para enviar');
        return;
      }

      const subject = `🔔 ${scheduledNotification.title}`;

      for (const email of emails) {
        await this.sendNotificationEmail(email, subject, 'scheduled_reminder', {
          title: scheduledNotification.title,
          message: scheduledNotification.message,
          scheduled_date: scheduledNotification.scheduled_date
        });
      }

      // Marcar como email enviado
      await this.scheduledNotificationRepository.update(
        scheduledNotification.id,
        {
          email_sent: true,
          email_sent_at: new Date()
        }
      );

      this.logger.log(`📧 Emails enviados a ${emails.length} destinatarios`);
    } catch (error) {
      this.logger.error(
        `❌ Error enviando emails de notificación programada:`,
        error
      );
    }
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

    try {
      await this.sendNotificationEmail(
        company.email,
        subject,
        'subscription_expiry',
        {
          company,
          plan,
          subscription
        }
      );
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

    try {
      await this.sendNotificationEmail(
        company.email,
        subject,
        'subscription_expired',
        {
          company,
          plan,
          subscription
        }
      );
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

    // 1. Crear notificación en BD para la empresa
    await this.createNotification(
      company.id,
      '🎉 ¡Feliz cumpleaños!',
      `Hoy es el cumpleaños de ${employee.first_name} ${employee.last_name}`,
      'birthday_reminder' as NotificationType
    );

    // 2. Crear notificación en BD para el empleado (si tiene usuario asociado)
    if (employee.user) {
      await this.createNotification(
        employee.user.id,
        '🎉 ¡Feliz cumpleaños!',
        `¡Feliz cumpleaños ${employee.first_name}! Que tengas un día maravilloso.`,
        'birthday_reminder' as NotificationType
      );
    }

    // 3. Enviar email al empleado (si tiene email) - FELICITACIÓN PERSONAL
    if (employee.email) {
      const employeeSubject = `🎉 ¡Feliz cumpleaños ${employee.first_name}!`;
      try {
        await this.sendNotificationEmail(
          employee.email,
          employeeSubject,
          'birthday_employee',
          {
            company,
            employee,
            isEmployee: true
          }
        );
        this.logger.log(
          `📧 Email de felicitación enviado al empleado ${employee.first_name} ${employee.last_name}`
        );
      } catch (error) {
        this.logger.error(`❌ Error enviando email al empleado:`, error);
      }
    }

    // 4. Enviar email a la empresa - RECORDATORIO PARA FELICITAR
    const companySubject = `🎉 Recordatorio: Hoy es el cumpleaños de ${employee.first_name}`;
    try {
      await this.sendNotificationEmail(
        company.email,
        companySubject,
        'birthday_company',
        {
          company,
          employee,
          isCompany: true
        }
      );
      this.logger.log(
        `📧 Email de recordatorio enviado a la empresa para ${employee.first_name} ${employee.last_name}`
      );
    } catch (error) {
      this.logger.error(`❌ Error enviando email a la empresa:`, error);
    }

    this.logger.log(
      `🎂 Notificación de cumpleaños completada para ${employee.first_name} ${employee.last_name}`
    );
  }

  // 🎊 Verificar feriados por país usando API
  private async checkCompanyHolidays(company: Company, date: Date) {
    try {
      // Obtener el país de la empresa (por defecto AR si no está configurado)
      const countryCode = company.country || 'AR';

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

        try {
          await this.sendNotificationEmail(company.email, subject, 'holiday', {
            company,
            holiday: isHoliday,
            date,
            countryCode
          });
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

      // Agregar timeout y mejor manejo de errores
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'HR-System/1.0'
        }
      });

      clearTimeout(timeoutId);

      // Verificar status de respuesta
      if (!response.ok) {
        this.logger.warn(
          `⚠️ API de feriados respondió con status ${response.status}`
        );
        return { isHoliday: false };
      }

      // Verificar si la respuesta tiene contenido
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        this.logger.warn(`⚠️ API de feriados devolvió respuesta vacía`);
        return { isHoliday: false };
      }

      const isHoliday = JSON.parse(responseText);

      if (isHoliday) {
        // Si es feriado, obtener el nombre del feriado
        const holidayInfoUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
        try {
          const holidayResponse = await fetch(holidayInfoUrl, {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
              'User-Agent': 'HR-System/1.0'
            }
          });

          if (holidayResponse.ok) {
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
        } catch (holidayError) {
          this.logger.warn(
            `⚠️ Error obteniendo nombre del feriado: ${holidayError.message}`
          );
        }

        return {
          isHoliday: true,
          name: 'Feriado'
        };
      }

      return { isHoliday: false };
    } catch (error) {
      if (error.name === 'AbortError') {
        this.logger.warn(
          `⚠️ Timeout consultando API de feriados para ${countryCode}`
        );
      } else {
        this.logger.error(
          `❌ Error consultando API de feriados: ${error.message}`
        );
      }

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
    const user = await this.findUserById(userId);

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
    const user = await this.findUserById(userId);

    let config = await this.configRepository.findOne({
      where: { user_id: userId }
    });

    if (!config) {
      config = this.configRepository.create({ user_id: userId });
    }

    Object.assign(config, configData);
    return await this.configRepository.save(config);
  }

  // -------------------------------
  // 🔧 MÉTODOS PRIVADOS DE UTILIDAD
  // -------------------------------

  // Validar y obtener usuario por ID
  private async findUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  // Validar y obtener recordatorio programado por ID
  private async findScheduledReminderById(
    userId: string,
    id: string
  ): Promise<ScheduledNotification> {
    const scheduledReminder =
      await this.scheduledNotificationRepository.findOne({
        where: {
          id,
          created_by: userId,
          is_deleted: false
        }
      });

    if (!scheduledReminder) {
      throw new NotFoundException('Recordatorio programado no encontrado');
    }

    return scheduledReminder;
  }

  // Validar que la fecha sea futura
  private validateFutureDate(scheduledDate: Date): void {
    const now = new Date();
    if (scheduledDate <= now) {
      throw new BadRequestException(
        'No se puede programar un recordatorio para una fecha pasada'
      );
    }
  }

  // Enviar email de notificación con template
  private async sendNotificationEmail(
    to: string,
    subject: string,
    template: string,
    data: any
  ): Promise<void> {
    const html = this.createHtmlTemplate(template, data);
    await this.sendEmail(to, subject, html);
  }

  // Crear template HTML según el tipo
  private createHtmlTemplate(template: string, data: any): string {
    switch (template) {
      case 'subscription_expiry':
        return this.getSubscriptionExpiryTemplate(data);
      case 'subscription_expired':
        return this.getSubscriptionExpiredTemplate(data);
      case 'birthday_employee':
        return this.getBirthdayEmployeeTemplate(data);
      case 'birthday_company':
        return this.getBirthdayCompanyTemplate(data);
      case 'holiday':
        return this.getHolidayTemplate(data);
      case 'scheduled_reminder':
        return this.getScheduledReminderTemplate(data);
      default:
        return this.getDefaultTemplate(data);
    }
  }

  // Template para suscripción por expirar
  private getSubscriptionExpiryTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">⚠️ Recordatorio de Expiración</h2>
        <p>Hola <strong>${data.company.legal_name}</strong>,</p>
        <p>Te informamos que tu suscripción al plan <strong>${data.plan.name}</strong> expirará en <strong>7 días</strong>.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalles de tu suscripción:</h3>
          <ul>
            <li><strong>Plan:</strong> ${data.plan.name}</li>
            <li><strong>Precio:</strong> $${data.plan.price}</li>
            <li><strong>Fecha de expiración:</strong> ${data.subscription.end_date.toLocaleDateString()}</li>
          </ul>
        </div>
        <p>Para renovar tu suscripción, por favor contacta con nuestro equipo de soporte.</p>
        <p>Saludos,<br>Equipo HR System</p>
      </div>
    `;
  }

  // Template para suscripción expirada
  private getSubscriptionExpiredTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">🚫 Suscripción Expirada</h2>
        <p>Hola <strong>${data.company.legal_name}</strong>,</p>
        <p>Tu suscripción al plan <strong>${data.plan.name}</strong> ha expirado el <strong>${data.subscription.end_date.toLocaleDateString()}</strong>.</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>⚠️ Acceso Limitado</h3>
          <p>Algunas funcionalidades pueden estar limitadas hasta que renueves tu suscripción.</p>
        </div>
        <p>Para renovar y continuar disfrutando de todos nuestros servicios, contacta con nuestro equipo.</p>
        <p>Saludos,<br>Equipo HR System</p>
      </div>
    `;
  }

  // Template para cumpleaños del EMPLEADO (felicitación personal)
  private getBirthdayEmployeeTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e91e63;">🎉 ¡Feliz Cumpleaños ${data.employee.first_name}!</h2>
        <p>¡Que tengas un día maravilloso!</p>
        <p>Te desea <strong>${data.company.legal_name}</strong></p>
        <p style="font-size: 16px; color: #666;">¡Esperamos que disfrutes mucho tu día especial! 🎈</p>
        <p>Saludos</p>
      </div>
    `;
  }

  // Template para cumpleaños de la EMPRESA (recordatorio)
  private getBirthdayCompanyTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🎂 Recordatorio de Cumpleaños</h2>
        <p>Hola <strong>${data.company.legal_name}</strong>,</p>
        <p>Ya enviamos un email saludando a <strong>${data.employee.first_name} ${data.employee.last_name}</strong>, para que en su día se sienta especial.</p>
        <p>Saludos,<br>Equipo HR System</p>
      </div>
    `;
  }

  // Template para feriados
  private getHolidayTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f39c12;">🎊 Recordatorio de Feriado</h2>
        <p>Hola <strong>${data.company.legal_name}</strong>,</p>
        <p>Te recordamos que <strong>Hoy es feriado</strong>: <strong>${data.holiday.name}</strong></p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>📅 Información del feriado:</h3>
          <ul>
            <li>${data.holiday.name}</li>
          </ul>
        </div>
        <p>¡Que tengas un excelente día libre! 🎉</p>
        <p>Saludos,<br>Equipo HR System</p>
      </div>
    `;
  }

  // Template para recordatorios programados
  private getScheduledReminderTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🔔 Recordatorio Programado</h2>
        <p><strong>${data.title}</strong></p>
        <p>${data.message}</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">
            Este recordatorio fue programado para ${data.scheduled_date.toLocaleString()}
          </p>
        </div>
      </div>
    `;
  }

  // Template por defecto
  private getDefaultTemplate(data: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">${data.title || 'Notificación'}</h2>
        <p>${data.message}</p>
      </div>
    `;
  }

  // -------------------------------
  // 📅 MÉTODOS PARA RECORDATORIOS PROGRAMADOS
  // -------------------------------

  // Obtener recordatorios programados del usuario
  async getScheduledReminders(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const [scheduledReminders, total] =
        await this.scheduledNotificationRepository.findAndCount({
          where: {
            created_by: userId,
            is_deleted: false
          },
          order: { created_at: 'DESC' },
          skip: (page - 1) * limit,
          take: limit
        });

      return {
        scheduledReminders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error('Error obteniendo recordatorios programados:', error);
      throw error;
    }
  }

  // Obtener un recordatorio programado específico
  async getScheduledReminder(userId: string, id: string) {
    return await this.findScheduledReminderById(userId, id);
  }

  // Cancelar un recordatorio programado
  async cancelScheduledReminder(userId: string, id: string) {
    const scheduledReminder = await this.findScheduledReminderById(userId, id);

    if (scheduledReminder.is_executed) {
      throw new BadRequestException(
        'No se puede cancelar un recordatorio que ya fue ejecutado'
      );
    }

    scheduledReminder.is_deleted = true;
    return await this.scheduledNotificationRepository.save(scheduledReminder);
  }

  // Actualizar un recordatorio programado
  async updateScheduledReminder(
    userId: string,
    id: string,
    title: string,
    message: string,
    scheduledDate: Date,
    recipientType: RecipientType = RecipientType.ALL,
    recipientEmails?: string[],
    recipientEmployeeIds?: string[]
  ) {
    const scheduledReminder = await this.findScheduledReminderById(userId, id);

    if (scheduledReminder.is_executed) {
      throw new BadRequestException(
        'No se puede actualizar un recordatorio que ya fue ejecutado'
      );
    }

    // Validar fecha futura
    this.validateFutureDate(scheduledDate);

    // Actualizar campos
    scheduledReminder.title = title;
    scheduledReminder.message = message;
    scheduledReminder.scheduled_date = scheduledDate;
    scheduledReminder.recipient_type = recipientType;
    scheduledReminder.recipient_emails = recipientEmails
      ? JSON.stringify(recipientEmails)
      : '';
    scheduledReminder.recipient_employee_ids = recipientEmployeeIds
      ? JSON.stringify(recipientEmployeeIds)
      : '';

    return await this.scheduledNotificationRepository.save(scheduledReminder);
  }

  // -------------------------------
  // 🎊 MÉTODOS PARA FERIADOS
  // -------------------------------

  // Obtener feriados de un país para un año específico
  async getHolidaysForCountry(countryCode: string, year: number) {
    try {
      const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Error consultando feriados: ${response.statusText}`);
      }

      const holidays = await response.json();

      return {
        country: countryCode,
        year,
        holidays: holidays.map((holiday: any) => ({
          date: holiday.date,
          name: holiday.name,
          localName: holiday.localName,
          countryCode: holiday.countryCode,
          fixed: holiday.fixed,
          global: holiday.global,
          counties: holiday.counties,
          launchYear: holiday.launchYear,
          types: holiday.types
        }))
      };
    } catch (error) {
      this.logger.error(
        `❌ Error obteniendo feriados para ${countryCode} ${year}:`,
        error
      );
      throw new Error(
        `No se pudieron obtener los feriados para ${countryCode} en ${year}`
      );
    }
  }

  // Verificar si una fecha específica es feriado
  async checkHolidayForDate(countryCode: string, date: Date) {
    try {
      const isHoliday = await this.checkHolidayAPI(countryCode, date);

      return {
        date: date.toISOString().split('T')[0],
        country: countryCode,
        isHoliday: isHoliday.isHoliday,
        holidayName: isHoliday.name || null
      };
    } catch (error) {
      this.logger.error(
        `❌ Error verificando feriado para ${countryCode} ${date}:`,
        error
      );
      throw new Error(
        `No se pudo verificar el feriado para ${countryCode} en ${date.toISOString().split('T')[0]}`
      );
    }
  }
}
