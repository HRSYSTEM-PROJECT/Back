import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  NotFoundException
} from '@nestjs/common';
import { Request } from 'express';
import { EmpresaService } from 'src/empresa/empresa.service';
import { EmpleadoService } from 'src/empleado/empleado.service';
import { Plans } from 'src/plan/enums/plan.enum';
import { Company } from 'src/empresa/entities/empresa.entity';
import { Employee } from 'src/empleado/entities/empleado.entity';

@Injectable()
export class EmployeeLimitGuard implements CanActivate {
  constructor(
    private readonly companyService: EmpresaService,
    private readonly employeeService: EmpleadoService
  ) {}

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
    const plan = company.suscripciones?.plan;
    if (!plan) {
      throw new ForbiddenException('La empresa no posee un plan activo.');
    }

    // Encontrar empleados de la empresa
    const employees: Employee[] =
      await this.employeeService.findAllByCompany(user);

    //Contar empleados
    const employeeCount = employees.length;

    // Verificar límites según el plan
    if (plan.name === Plans.FREE && employeeCount >= 10) {
      throw new ForbiddenException(
        `Tu plan (${Plans.FREE}) permite un máximo de 10 empleados. Actualiza tu plan para continuar.`
      );
    }

    if (plan.name === Plans.PREMIUM && employeeCount >= 100) {
      throw new ForbiddenException(
        `Tu plan (${Plans.PREMIUM}) permite un máximo de 100 empleados. Actualiza tu plan para continuar.`
      );
    }

    // Si es ENTERPRISE o no ha superado el límite, permitir el acceso
    return true;
  }
}
