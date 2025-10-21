import {
  Injectable,
  NotFoundException,
  InternalServerErrorException
} from '@nestjs/common';
import { AuthenticatedUser } from 'src/interfaces/authenticated-user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-empleado.dto';
import { UpdateEmployeeDto } from './dto/update-empleado.dto';
import { SearchEmpleadoDto } from './dto/search-empleado.dto';
import { Employee } from './entities/empleado.entity';
import { Departamento } from 'src/departamento/entities/departamento.entity';
import { Position } from 'src/position/entities/position.entity';
import { Absence } from 'src/absence/entities/absence.entity';
import { Company } from 'src/empresa/entities/empresa.entity';
//import { User } from 'src/user/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadService } from '../upload/upload.service';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
//import { validate as IsUuid } from 'uuid';

@Injectable()
export class EmpleadoService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(Departamento)
    private readonly departmentsRepository: Repository<Departamento>,
    @InjectRepository(Position)
    private readonly positionsRepository: Repository<Position>,
    private readonly notificationsService: NotificationsService,
    private readonly uploadService: UploadService,
    @InjectRepository(Absence)
    private readonly absenceRepository: Repository<Absence>
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
  // async create(
  //   createEmployeeDto: CreateEmployeeDto,
  //   user: AuthenticatedUser
  // ): Promise<Employee> {
  //   //Enconrtar la empresa en común
  //   const company = await this.companiesRepository.findOne({
  //     where: { id: user.companyId }
  //   });
  //   if (!company) {
  //     throw new NotFoundException('Company not found.');
  //   }

  //   //Encontrar el departamento al que pertenece que envia el front
  //   const department = await this.departmentsRepository.findOne({
  //     where: { id: createEmployeeDto.department_id }
  //   });
  //   if (!department) {
  //     throw new NotFoundException('Deparment ID not valid or not found.');
  //   }

  //   //Encontrar la posición a la que pertenece que envía el front
  //   const position = await this.positionsRepository.findOne({
  //     where: { id: createEmployeeDto.position_id }
  //   });
  //   if (!position) {
  //     throw new NotFoundException('Position ID not valid or not found.');
  //   }

  //   try {
  //     //Establecer relaciones y valores enviados desde el front
  //     const employee = new Employee();
  //     employee.company = company;
  //     employee.department = department;
  //     employee.position = position;
  //     employee.first_name = createEmployeeDto.first_name;
  //     employee.last_name = createEmployeeDto.last_name;
  //     employee.dni = createEmployeeDto.dni;
  //     employee.cuil = createEmployeeDto.cuil;
  //     employee.phone_number = createEmployeeDto.phone_number;
  //     employee.email = createEmployeeDto.email;
  //     employee.imgUrl = createEmployeeDto.imgUrl;
  //     employee.salary = createEmployeeDto.salary;

  //     const savedEmployee = await this.employeeRepository.save(employee);

  //     // 🔔 Notificar empleado agregado
  //     try {
  //       await this.notificationsService.notifyEmployeeAdded(
  //         user.companyId,
  //         `${savedEmployee.first_name} ${savedEmployee.last_name}`,
  //         savedEmployee.position?.name || 'Empleado'
  //       );
  //     } catch (notificationError) {
  //       console.error('Error enviando notificación:', notificationError);
  //     }

  //     return savedEmployee;
  //   } catch (error) {
  //     console.error('Error creando empleado:', error);
  //     throw new InternalServerErrorException('No se pudo crear el empleado');
  //   }
  // }

  //refactor con cloudinary
  async create(
  createEmployeeDto: CreateEmployeeDto,
  user: AuthenticatedUser
): Promise<Employee> {
  const company = await this.companiesRepository.findOne({
    where: { id: user.companyId }
  });
  if (!company) throw new NotFoundException('Company not found.');

  const department = await this.departmentsRepository.findOne({
    where: { id: createEmployeeDto.department_id }
  });
  if (!department) throw new NotFoundException('Department not found.');

  const position = await this.positionsRepository.findOne({
    where: { id: createEmployeeDto.position_id }
  });
  if (!position) throw new NotFoundException('Position not found.');

  const employee = this.employeeRepository.create({
    ...createEmployeeDto,
    company,
    department,
    position
  });

  const savedEmployee = await this.employeeRepository.save(employee);

  try {
    await this.notificationsService.notifyEmployeeAdded(
      user.companyId,
      `${savedEmployee.first_name} ${savedEmployee.last_name}`,
      savedEmployee.position?.name || 'Empleado'
    );
  } catch (err) {
    console.error('Error enviando notificación:', err);
  }

  return savedEmployee;
}

  // ---- Listar todos ----
  async findAll(
    user: AuthenticatedUser
  ): Promise<(Employee & { age?: number })[]> {
      if (!user.companyId || user.companyId.trim() === '') {
      throw new NotFoundException('Usuario sin empresa asignada');
    }
    const employees = await this.employeeRepository.find({
      where: { company: { id: user.companyId } },
      relations: ['company', 'department']
    });

    return employees.map((emp) => ({
      ...emp,
      age: emp.birthdate ? this.calculateAge(emp.birthdate) : undefined
    }));
  }

  // ---- Buscar uno ----
  async findOne(
    id: string,
    user: AuthenticatedUser
  ): Promise<Employee & { age?: number }> {
    const employee = await this.employeeRepository.findOne({
      where: { id, company: { id: user.companyId } },
      relations: ['company', 'department']
    });

    if (!employee)
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);

    return {
      ...employee,
      age: employee.birthdate
        ? this.calculateAge(employee.birthdate)
        : undefined
    };
  }

  // ---- Buscar por filtros ----
  async search(user: AuthenticatedUser, searchDto: SearchEmpleadoDto) {
    const { id, dni, last_name } = searchDto;
    const where: any = { company: { id: user.companyId } };

    if (id) where.id = id;
    if (dni) where.dni = dni;
    if (last_name) where.last_name = last_name;

    const employees = await this.employeeRepository.find({
      where,
      relations: ['company', 'department']
    });

    if (!employees.length) {
      throw new NotFoundException(
        'No se encontraron empleados con esos criterios'
      );
    }

    return employees.map((emp) => ({
      ...emp,
      age: emp.birthdate ? this.calculateAge(emp.birthdate) : undefined
    }));
  }

  // ---- Actualizar ----
  async update(
    id: string,
    dto: UpdateEmployeeDto,
    user: AuthenticatedUser
  ): Promise<Employee> {
    // Separar los IDs de relación del resto del DTO
    const { department_id, position_id, company_id, ...employeeProps } = dto;

    // 'employeeProps' contiene ahora solo las propiedades directas de Employee (first_name, salary, etc.)
    const updateData: Partial<Employee> = employeeProps;

    // Actualización del Departamento
    if (department_id) {
      const newDepartment = await this.departmentsRepository.findOne({
        where: { id: department_id, company: { id: user.companyId } }
      });

      if (!newDepartment) {
        throw new NotFoundException(
          'Department ID not found or does not belong to the company.'
        );
      }

      // Asignar la ENTIDAD al campo de relación 'department'
      updateData.department = newDepartment;
    }

    // Actualización de la Posición
    if (position_id) {
      const newPosition = await this.positionsRepository.findOne({
        where: { id: position_id, company: { id: user.companyId } }
      });

      if (!newPosition) {
        throw new NotFoundException(
          'Position ID not found or does not belong to the company.'
        );
      }

      // Asignar la ENTIDAD al campo de relación 'position'
      updateData.position = newPosition;
    }

    //Ejecutar la actualización con el objeto 'updateData'
    await this.employeeRepository.update(
      { id, company: { id: user.companyId } },
      updateData
    );
    return this.findOne(id, user);
  }

  // ---- Eliminar ----
  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    await this.employeeRepository.softDelete({
      id,
      company: { id: user.companyId }
    });
  }

  // ---- Ausencias ----
  // async getAusenciasByEmpleado(
  //   employeeId: string,
  //   user: AuthenticatedUser,
  //   month?: number,
  //   year?: number
  // ): Promise<Absence[]> {
  //   const empleado = await this.employeeRepository.findOne({
  //     where: { id: employeeId, company: { id: user.companyId } },
  //     relations: ['absences']
  //   });

  //   if (!empleado) {
  //     throw new NotFoundException('Empleado no encontrado en tu empresa');
  //   }

  //   const now = new Date();
  //   const targetMonth = month ?? now.getMonth() + 1;
  //   const targetYear = year ?? now.getFullYear();

  //   return empleado.absences.filter((ausencia) => {
  //     const fecha = new Date(ausencia.start_date);
  //     return (
  //       fecha.getMonth() + 1 === targetMonth &&
  //       fecha.getFullYear() === targetYear
  //     );
  //   });
  // }

   async getAusenciasByEmpleado(
    employeeId: string,
    user: AuthenticatedUser,
    month?: number,
    year?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Absence[]; total: number; page: number; limit: number }> {
    // Fecha objetivo
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    // Inicio y fin del mes
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Verificar que el empleado exista y pertenezca a la empresa
    const empleado = await this.employeeRepository.findOne({
      where: { id: employeeId, company: { id: user.companyId } },
    });

    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado en tu empresa');
    }

    // Query paginada considerando ausencias que cruzan meses
    const [data, total] = await this.absenceRepository.findAndCount({
      where: {
        employee: { id: employeeId, company: { id: user.companyId } },
        // Considera ausencias que empiezan o terminan dentro del mes
        start_date: LessThanOrEqual(endOfMonth),
        end_date: MoreThanOrEqual(startOfMonth),
      },
      order: { start_date: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }
}
