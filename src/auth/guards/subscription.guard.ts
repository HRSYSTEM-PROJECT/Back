import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { Request } from 'express';
import { EmpresaService } from 'src/empresa/empresa.service';
import { Plans } from 'src/plan/enums/plan.enum';
import { Company } from 'src/empresa/entities/empresa.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly companyService: EmpresaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user;

    // Validar companyId del usuario.
    if (!user || !user.companyId) {
      throw new ForbiddenException(
        'El usuario no está asociado a ninguna empresa válida.'
      );
    }

    // Encontrar la empresa con su suscripción y plan
    const company: Company = await this.companyService.findOneWithSubscription(
      user.companyId
    );

    if (!company) {
      throw new NotFoundException(
        `Empresa con ID ${user.companyId} no encontrada.`
      );
    }

    // Caso MUY raro
    const suscripcion = company.suscripciones;
    if (!suscripcion) {
      throw new ForbiddenException(
        'La empresa no posee una suscripción activa.'
      );
    }

    const plan = suscripcion.plan;
    if (!plan) {
      throw new ForbiddenException('La suscripción no posee un plan asociado.');
    }

    // Verificar si el plan es el FREE
    if (plan.name === Plans.FREE) {
      throw new ForbiddenException(
        'Tu plan actual no permite acceder a esta funcionalidad. Actualiza tu plan para continuar.'
      );
    }

    // Si todo bien, permitir acceso
    return true;
  }
}
