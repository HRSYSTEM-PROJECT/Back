import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Rol } from 'src/rol/entities/rol.entity';
import { Company } from 'src/empresa/entities/empresa.entity';
import { Employee } from 'src/empleado/entities/empleado.entity';
import { AuthenticatedUser } from 'src/interfaces/authenticated-user.interface';
import { Role } from 'src/rol/enums/role.enum';
import { ClerkService } from 'src/auth/clerk.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rol)
    private readonly rolesRepository: Repository<Rol>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
    private readonly clerkService: ClerkService
  ) {}

  //---------------Crear nuevo usuario---------------/
  async create(createUserDto: CreateUserDto, user: AuthenticatedUser) {
    //Validar email único
    const userFound = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (userFound) {
      throw new ConflictException('Email already exist.');
    }

    //Determinar el rol a asignar según el usuario logueado
    let roleName: string;

    switch (user.rol) {
      case Role.SUPER_ADMIN:
        roleName = Role.SUPER_ADMIN;
        break;

      // Ambos casos resultan en el mismo rol.
      case Role.COMPANY_OWNER:
      case Role.HR_MANAGER:
        roleName = Role.HR_MANAGER;
        break;

      default:
        throw new ForbiddenException('You are not allowed to create users.');
    }

    //Buscar rol en BD
    const rol = await this.rolesRepository.findOne({
      where: { name: roleName }
    });

    if (!rol) {
      throw new NotFoundException(`Rol ${roleName} not found in DB`);
    }

    //Buscar empresa si el usuario logueado tiene company
    let company: Company | null = null;
    if (user.companyId) {
      company = await this.companiesRepository.findOne({
        where: { id: user.companyId }
      });

      if (!company) {
        throw new NotFoundException('Invalid Company ID');
      }
    }

    //Si se proporciona employee_id, lo asociamos
    let employee: Employee | null = null;
    if (createUserDto.employee_id) {
      employee = await this.employeesRepository.findOne({
        where: { id: createUserDto.employee_id }
      });

      if (!employee) {
        throw new NotFoundException('Invalid Employee ID');
      }
    }

    //Crear usuario en Clerk
    const userName: string = `${createUserDto.first_name} ${createUserDto.last_name}`;

    const clerkUser = await this.clerkService.createUser(
      createUserDto.email,
      createUserDto.password,
      userName
    );

    //Creacion y carga de user en DB
    const newUser = new User();
    newUser.clerkId = clerkUser.id;
    newUser.role = rol;
    newUser.email = createUserDto.email;
    if (company) {
      newUser.company = company;
    }
    if (employee) {
      newUser.employee = employee;
    }
    newUser.first_name = createUserDto.first_name;
    newUser.last_name = createUserDto.last_name;
    newUser.profile_image_url = createUserDto.profile_image_url;
    newUser.created_at = new Date();
    newUser.updated_at = new Date();

    await this.userRepository.save(newUser);

    return {
      message: `User created successfully as ${roleName}`,
      user: newUser
    };
  }

  //-----Encontrar todos los usuarios----//
  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['role'] });
  }

  //-----Encontrar todos los usuarios de una empersa-----//
  async findAllByCompany(companyId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { company: { id: companyId } },
      relations: ['role']
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'company', 'employee']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user as User;
  }

  async findByClerkId(clerkId: string) {
    return this.userRepository.findOne({
      where: { clerkId: clerkId },
      relations: ['company', 'role']
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }

    if (!user.clerkId) {
      //Si el usuario existe en tu DB pero no en Clerk (MUY raro)
      console.warn(`Usuario ${id} no tiene un clerkId asociado.`);
      throw new BadRequestException(
        'Usuario no cuenta con un clerkId asociado'
      );
    }
    // Preparar el payload de Clerk
    const clerkPayload: Record<string, any> = {};

    // Mapea los campos del DTO a los campos de Clerk
    if (updateUserDto.email) {
      clerkPayload.emailAddress = [updateUserDto.email];
    }
    if (updateUserDto.first_name) {
      clerkPayload.firstName = updateUserDto.first_name;
    }
    if (updateUserDto.password) {
      clerkPayload.password = updateUserDto.password;
    }

    // Actualizar Clerk solo si hay algo para actualizar
    if (Object.keys(clerkPayload).length > 0) {
      try {
        await this.clerkService.updateUser(user.clerkId, clerkPayload);
      } catch (error) {
        console.error('Error al actualizar usuario en Clerk:', error);
        // Lanza una excepción interna, ya que el fallo en Clerk es crítico para la autenticación
        throw new InternalServerErrorException(
          'Fallo al sincronizar la actualización de usuario con Clerk.'
        );
      }
    }

    //Actualizar en la DB
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }

    if (!user.clerkId) {
      //Si el usuario existe en tu DB pero no en Clerk (MUY raro)
      console.warn(`Usuario ${id} no tiene un clerkId asociado.`);
      throw new BadRequestException(
        'Usuario no cuenta con un clerkId asociado'
      );
    }
    try {
      await this.clerkService.deleteUser(user.clerkId);
    } catch (error) {
      console.error('Error al eliminar usuario en Clerk:', error);
      // Lanza una excepción interna, ya que el fallo en Clerk es crítico
      throw new InternalServerErrorException(
        'Fallo al eliminar el usuario de Clerk.'
      );
    }
    await this.userRepository.softDelete(id);
  }
}
