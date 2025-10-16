import {
  Injectable,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/empleado.entity';
import { CreateEmployeeDto } from './dto/create-empleado.dto';
import { UpdateEmployeeDto } from './dto/update-empleado.dto';
import { SearchEmpleadoDto } from './dto/search-empleado.dto';
import { User } from 'src/user/entities/user.entity';
import { Absence } from 'src/absence/entities/absence.entity';
import { NotificationsService } from '../notifications/notifications.service';
@Injectable()
export class EmpleadoService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly notificationsService: NotificationsService
  ) {}

  private calculateAge(birthdate: Date): number {
    if (!birthdate || isNaN(new Date(birthdate).getTime())) return 0;
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  // ---- Crear empleado (multi-tenant con Clerk) ----
  async create(
    createEmployeeDto: CreateEmployeeDto,
    user: any
  ): Promise<Employee> {
    try {
      const employee = this.employeeRepository.create({
        ...createEmployeeDto,
        company: { id: user.companyId }, // <- Clerk usa companyId, no company object
        user: { id: user.id }            // <- relación con usuario autenticado
      });

      const savedEmployee = await this.employeeRepository.save(employee);

      // 🔔 Notificar empleado agregado
      try {
        await this.notificationsService.notifyEmployeeAdded(
          user.companyId,
          `${savedEmployee.first_name} ${savedEmployee.last_name}`,
          savedEmployee.position?.name || 'Empleado'
        );
      } catch (notificationError) {
        console.error('Error enviando notificación:', notificationError);
      }

      return savedEmployee;
    } catch (error) {
      console.error('Error creando empleado:', error);
      throw new InternalServerErrorException('No se pudo crear el empleado');
    }
  }

  // ---- Listar todos ----
  async findAll(user: any): Promise<(Employee & { age?: number })[]> {
    if (!user.companyId) {
      throw new InternalServerErrorException('User has no associated company');
    }

    const employees = await this.employeeRepository.find({
      where: { company: { id: user.companyId } },
      relations: ['company', 'department', 'user']
    });

    return employees.map((emp) => ({
      ...emp,
      age: emp.birthdate ? this.calculateAge(emp.birthdate) : undefined
    }));
  }

  // ---- Buscar uno ----
  async findOne(id: string, user: any): Promise<Employee & { age?: number }> {
    if (!user.companyId) {
      throw new InternalServerErrorException('User has no associated company');
    }

    const employee = await this.employeeRepository.findOne({
      where: { id, company: { id: user.companyId } },
      relations: ['company', 'department', 'user']
    });

    if (!employee)
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);

    return {
      ...employee,
      age: employee.birthdate ? this.calculateAge(employee.birthdate) : undefined
    };
  }

  // ---- Buscar por filtros ----
  async search(user: any, searchDto: SearchEmpleadoDto) {
    if (!user.companyId) {
      throw new InternalServerErrorException('User has no associated company');
    }

    const { id, dni, last_name } = searchDto;
    const where: any = { company: { id: user.companyId } };

    if (id) where.id = id;
    if (dni) where.dni = dni;
    if (last_name) where.last_name = last_name;

    const employees = await this.employeeRepository.find({
      where,
      relations: ['company', 'department', 'user']
    });

    if (!employees.length) {
      throw new NotFoundException('No se encontraron empleados con esos criterios');
    }

    return employees.map((emp) => ({
      ...emp,
      age: emp.birthdate ? this.calculateAge(emp.birthdate) : undefined
    }));
  }

  // ---- Actualizar ----
  async update(id: string, dto: UpdateEmployeeDto, user: any): Promise<Employee> {
    if (!user.companyId) {
      throw new InternalServerErrorException('User has no associated company');
    }

    await this.employeeRepository.update(
      { id, company: { id: user.companyId } },
      dto
    );
    return this.findOne(id, user);
  }

  // ---- Eliminar ----
  async remove(id: string, user: any): Promise<void> {
    if (!user.companyId) {
      throw new InternalServerErrorException('User has no associated company');
    }

    await this.employeeRepository.softDelete({
      id,
      company: { id: user.companyId }
    });
  }

  // ---- Ausencias ----
  async getAusenciasByEmpleado(
    employeeId: string,
    user: any,
    month?: number,
    year?: number
  ): Promise<Absence[]> {
    if (!user.companyId) {
      throw new InternalServerErrorException('User has no associated company');
    }

    const empleado = await this.employeeRepository.findOne({
      where: { id: employeeId, company: { id: user.companyId } },
      relations: ['absences']
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado en tu empresa');
    }

    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    return empleado.absences.filter((ausencia) => {
      const fecha = new Date(ausencia.start_date);
      return (
        fecha.getMonth() + 1 === targetMonth &&
        fecha.getFullYear() === targetYear
      );
    });
  }
}
