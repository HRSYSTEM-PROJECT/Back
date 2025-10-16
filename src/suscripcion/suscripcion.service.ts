import {
  Injectable,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { UpdateSuscripcionDto } from './dto/update-suscripcion.dto';
import { Suscripcion } from './entities/suscripcion.entity';
import { CreateSuscripcionDto } from './dto/create-suscripcion.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { Plan } from '../plan/entities/plan.entity';
import { Company } from '../empresa/entities/empresa.entity';
import { CreateSubscriptionRequestDto } from './dto/create-subscription-request.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';

@Injectable()
export class SuscripcionService {
  constructor(
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepository: Repository<Suscripcion>,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly notificationsService: NotificationsService
  ) {}

  // Nuevo método para crear suscripción desde empresa autenticada
  async createSubscription(
    createSubscriptionDto: CreateSubscriptionRequestDto,
    companyId: string
  ): Promise<SubscriptionResponseDto> {
    // Verificar si ya existe una suscripción activa
    const existingSubscription = await this.suscripcionRepository.findOne({
      where: {
        company: { id: companyId },
        end_date: new Date() // Verificar que no haya expirado
      },
      relations: ['plan']
    });

    if (existingSubscription && existingSubscription.end_date > new Date()) {
      throw new ConflictException(
        'La empresa ya tiene una suscripción activa.'
      );
    }

    // Buscar el plan
    const plan = await this.planRepository.findOne({
      where: { id: createSubscriptionDto.plan_id }
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    // Calcular fechas
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration_days);

    // Crear la suscripción
    const suscripcion = this.suscripcionRepository.create({
      company: { id: companyId },
      plan: { id: plan.id },
      start_date: startDate,
      end_date: endDate
    });

    const savedSubscription =
      await this.suscripcionRepository.save(suscripcion);

    // Enviar notificación
    try {
      await this.notificationsService.createNotification(
        companyId,
        '🎉 Nueva suscripción activada',
        `Tu suscripción al plan ${plan.name} ha sido activada exitosamente`,
        'subscription_updated' as NotificationType
      );
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }

    // Retornar respuesta formateada
    return {
      id: savedSubscription.id,
      empresa_id: companyId,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        duration_days: plan.duration_days
      },
      status: 'active',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };
  }

  /*  async create(
    createSuscripcionDto: CreateSuscripcionDto
  ): Promise<Suscripcion> {
    // Generar token único para la suscripción  
    const token = this.generateUniqueToken();

    const suscripcion:Suscripcion = this.suscripcionRepository.create({
      ...createSuscripcionDto,
      token
    });

    return await this.suscripcionRepository.save(suscripcion);
  }*/

  async findAll(): Promise<Suscripcion[]> {
    return await this.suscripcionRepository.find({
      relations: ['company', 'plan'],
      order: { start_date: 'DESC' }
    });
  }

  //-----Encontrar todas las suscripciones de una empresa---//
  async getCompanySuscriptions(companyId: string) {
    const suscriptions: Suscripcion[] = await this.suscripcionRepository.find({
      where: { company: { id: companyId } },
      relations: ['company', 'plan']
    });

    return {
      message: 'Suscripcions found.',
      suscriptions: suscriptions
    };
  }

  //-----Encontrar la suscripcion actual de una empresa---//
  async getCompanyCurrentSuscription(companyId: string) {
    const currentDate = new Date();

    const activeSuscription = await this.suscripcionRepository.findOne({
      where: {
        company: { id: companyId },
        // Filtra donde la fecha de inicio es <= a la fecha actual
        start_date: LessThanOrEqual(currentDate),
        // Y la fecha de fin es >= a la fecha actual
        end_date: MoreThanOrEqual(currentDate)
      },
      relations: ['company', 'plan']
    });

    if (activeSuscription) {
      return {
        message: 'Current Suscripcion found.',
        suscripcion: activeSuscription
      };
    } else {
      throw new NotFoundException('No se encontró suscripcion activa.');
    }
  }

  //-----Añadir/"cambiar" la suscripcion actual de la empresa---//
  async addCompanySuscription(
    companyId: string,
    CreateSuscription: CreateSubscriptionRequestDto
  ) {
    const currentDate = new Date();

    //Buscar el plan nuevo en la DB
    const plan = await this.planRepository.findOne({
      where: { id: CreateSuscription.plan_id }
    });

    if (!plan) {
      throw new NotFoundException('Plan not found.');
    }

    //Encontrar la suscripcion activa
    const activeSuscription = await this.suscripcionRepository.findOne({
      where: {
        company: { id: companyId },
        // Filtra donde la fecha de inicio es <= a la fecha actual
        start_date: LessThanOrEqual(currentDate),
        // Y la fecha de fin es >= a la fecha actual
        end_date: MoreThanOrEqual(currentDate)
      }
    });

    if (!activeSuscription) {
      throw new NotFoundException('Current Suscription not found.');
    }

    //Encontrar la empresa:
    const company = await this.companyRepository.findOne({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException('Current Company not found');
    }

    //Nueva fecha de inicio
    const newStartDate = new Date(activeSuscription.end_date);
    newStartDate.setDate(newStartDate.getDate() + 1);

    //Nueva fecha de fin
    const newEndDate = new Date(newStartDate);

    const durationDays = plan.duration_days;
    newEndDate.setDate(newEndDate.getDate() + durationDays - 1);

    //Añadir nueva suscripcion
    const newSuscription = new Suscripcion();
    newSuscription.start_date = newStartDate;
    newSuscription.end_date = newEndDate;
    newSuscription.plan = plan;
    newSuscription.company = company;

    const savedSuscription =
      await this.suscripcionRepository.save(newSuscription);

    return {
      message: 'Suscripcion Changed.',
      suscripcion: savedSuscription
    };
  }

  async findOne(id: string): Promise<Suscripcion> {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id },
      relations: ['company', 'plan']
    });

    if (!suscripcion) {
      throw new Error('Suscripción no encontrada');
    }

    return suscripcion;
  }

  async update(
    id: string,
    updateSuscripcionDto: UpdateSuscripcionDto
  ): Promise<Suscripcion> {
    await this.suscripcionRepository.update(id, updateSuscripcionDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.suscripcionRepository.delete(id);
  }

  private generateUniqueToken(): string {
    return (
      'sub_' +
      Math.random().toString(36).substr(2, 9) +
      '_' +
      Date.now().toString(36)
    );
  }

  // 🔔 Método para notificar cambio de suscripción
  async notifySubscriptionChange(
    suscripcionId: string,
    changeType: string
  ): Promise<void> {
    try {
      const suscripcion = await this.findOne(suscripcionId);

      await this.notificationsService.createNotification(
        suscripcion.company.id,
        '🔄 Suscripción actualizada',
        `Tu suscripción ha sido ${changeType}. Plan: ${suscripcion.plan.name}`,
        'subscription_updated' as NotificationType
      );
    } catch (error) {
      console.error('Error enviando notificación de suscripción:', error);
    }
  }

  // 🔔 Método para notificar cancelación de suscripción
  async notifySubscriptionCancellation(suscripcionId: string): Promise<void> {
    try {
      const suscripcion = await this.findOne(suscripcionId);

      await this.notificationsService.createNotification(
        suscripcion.company.id,
        '❌ Suscripción cancelada',
        `Tu suscripción al plan ${suscripcion.plan.name} ha sido cancelada`,
        'subscription_cancelled' as NotificationType
      );
    } catch (error) {
      console.error('Error enviando notificación de cancelación:', error);
    }
  }
}
