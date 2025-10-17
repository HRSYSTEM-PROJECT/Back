// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Absence } from './entities/absence.entity';
// import { CreateAbsenceDto } from './dto/create-absence.dto';
// import { UpdateAbsenceDto } from './dto/update-absence.dto';
// import { NotificationsService } from '../notifications/notifications.service';
// import { Employee } from '../empleado/entities/empleado.entity';

// @Injectable()
// export class AbsenceService {
//   constructor(
//     @InjectRepository(Absence)
//     private readonly absenceRepository: Repository<Absence>,
//     @InjectRepository(Employee)
//     private readonly employeeRepository: Repository<Employee>,
//     private readonly notificationsService: NotificationsService
//   ) {}

//   async create(createAbsenceDto: CreateAbsenceDto): Promise<Absence> {
//     // Obtener información del empleado para la notificación
//     const employee = await this.employeeRepository.findOne({
//       where: { id: createAbsenceDto.employee_id },
//       relations: ['company']
//     });

//     if (!employee) {
//       throw new NotFoundException('Empleado no encontrado');
//     }

//     const absence = this.absenceRepository.create(createAbsenceDto);
//     const savedAbsence = await this.absenceRepository.save(absence);

//     // Enviar notificación de ausencia agregada
//     try {
//       await this.notificationsService.notifyAbsenceAdded(
//         employee.company.id,
//         `${employee.first_name} ${employee.last_name}`,
//         new Date(createAbsenceDto.start_date),
//         new Date(createAbsenceDto.end_date),
//         createAbsenceDto.description
//       );
//     } catch (error) {
//       console.error('Error enviando notificación de ausencia:', error);
//       // No lanzar error para no interrumpir la creación de la ausencia
//     }

//     return savedAbsence;
//   }

//   async findAll(): Promise<Absence[]> {
//     return await this.absenceRepository.find({
//       relations: ['employee']
//     });
//   }

//   async findByEmployee(employeeId: string): Promise<Absence[]> {
//     return await this.absenceRepository.find({
//       where: { employee_id: employeeId },
//       relations: ['employee']
//     });
//   }

//   async findOne(id: string): Promise<Absence> {
//     const absence = await this.absenceRepository.findOne({
//       where: { id },
//       relations: ['employee']
//     });

//     if (!absence) {
//       throw new NotFoundException('Ausencia no encontrada');
//     }

//     return absence;
//   }

//   async update(
//     id: string,
//     updateAbsenceDto: UpdateAbsenceDto
//   ): Promise<Absence> {
//     const absence = await this.findOne(id);

//     Object.assign(absence, updateAbsenceDto);
//     return await this.absenceRepository.save(absence);
//   }

//   async remove(id: string): Promise<void> {
//     const absence = await this.findOne(id);
//     await this.absenceRepository.remove(absence);
//   }
// }

//service adaptado para multiempresa
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Absence } from './entities/absence.entity';
import { CreateAbsenceDto } from './dto/create-absence.dto';
import { UpdateAbsenceDto } from './dto/update-absence.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Employee } from '../empleado/entities/empleado.entity';
import { AuthenticatedUser } from 'src/interfaces/authenticated-user.interface';

@Injectable()
export class AbsenceService {
  constructor(
    @InjectRepository(Absence)
    private readonly absenceRepository: Repository<Absence>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(
    createAbsenceDto: CreateAbsenceDto,
    user: AuthenticatedUser
  ): Promise<Absence> {
    const employee = await this.employeeRepository.findOne({
      where: {
        id: createAbsenceDto.employee_id,
        company: { id: user.companyId }
      },
      relations: ['company']
    });

    if (!employee) {
      throw new NotFoundException('Empleado no pertenece a tu empresa');
    }

    const absence = new Absence();
    absence.employee = employee;
    absence.start_date = new Date(createAbsenceDto.start_date);
    absence.end_date = new Date(createAbsenceDto.end_date);
    absence.description = createAbsenceDto.description;

    const savedAbsence = await this.absenceRepository.save(absence);

    try {
      await this.notificationsService.notifyAbsenceAdded(
        employee.company.id,
        `${employee.first_name} ${employee.last_name}`,
        absence.start_date,
        absence.end_date,
        absence.description
      );
    } catch (error) {
      console.error('Error enviando notificación de ausencia:', error);
    }

    return savedAbsence;
  }

  async findAll(user: AuthenticatedUser): Promise<Absence[]> {
    return await this.absenceRepository.find({
      relations: ['employee'],
      where: {
        employee: {
          company: { id: user.companyId }
        }
      }
    });
  }

  async findByEmployee(
    employeeId: string,
    user: AuthenticatedUser
  ): Promise<Absence[]> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, company: { id: user.companyId } }
    });

    if (!employee) {
      throw new NotFoundException('Empleado no pertenece a tu empresa');
    }

    return await this.absenceRepository.find({
      where: { employee: { id: employeeId } },
      relations: ['employee']
    });
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<Absence> {
    const absence = await this.absenceRepository.findOne({
      where: {
        id,
        employee: { company: { id: user.companyId } }
      },
      relations: ['employee']
    });

    if (!absence) {
      throw new NotFoundException('Ausencia no encontrada en tu empresa');
    }

    return absence;
  }

  async update(
    id: string,
    updateAbsenceDto: UpdateAbsenceDto,
    user: AuthenticatedUser
  ): Promise<Absence> {
    const absence = await this.findOne(id, user);

    Object.assign(absence, updateAbsenceDto);
    return await this.absenceRepository.save(absence);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    const absence = await this.findOne(id, user);
    await this.absenceRepository.remove(absence);
  }
}
