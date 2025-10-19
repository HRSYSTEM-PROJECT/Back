// // import {
// //   ConflictException,
// //   Injectable,
// //   NotFoundException
// // } from '@nestjs/common';
// // import { ClerkService } from './clerk.service';
// // import { InjectRepository } from '@nestjs/typeorm';
// // import { CreateRegisterDto } from './dto/create-register.dto';
// // import { Repository } from 'typeorm';
// // import { Company } from 'src/empresa/entities/empresa.entity';
// // import { User } from 'src/user/entities/user.entity';
// // import { Plan } from 'src/plan/entities/plan.entity';
// // import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
// // import { Rol } from 'src/rol/entities/rol.entity';
// // import { Role } from 'src/rol/enums/role.enum';

// // import { JwtService } from '@nestjs/jwt';

// // @Injectable()
// // export class AuthService {
// //   constructor(
// //     @InjectRepository(User)
// //     private readonly usersRepository: Repository<User>,
// //     @InjectRepository(Company)
// //     private readonly companiesRepository: Repository<Company>,
// //     @InjectRepository(Plan)
// //     private readonly plansRepository: Repository<Plan>,
// //     @InjectRepository(Suscripcion)
// //     private readonly suscriptionsRepository: Repository<Suscripcion>,
// //     @InjectRepository(Rol)
// //     private readonly rolesRepository: Repository<Rol>,
// //     private readonly clerkService: ClerkService,
// //     private readonly jwtService: JwtService
// //   ) {}

// //   //-------------Crear Registro-------------//
// //   async create(newRegister: CreateRegisterDto) {
// //     //Validar que no exista la empresa
// //     const companyFound: Company | null = await this.companiesRepository.findOne(
// //       {
// //         where: [
// //           { email: newRegister.email },
// //           { legal_name: newRegister.legal_name }
// //         ]
// //       }
// //     );

// //     if (companyFound) {
// //       if (companyFound.email === newRegister.email) {
// //         throw new ConflictException('Email already exist.');
// //       } else if (companyFound.legal_name === newRegister.legal_name) {
// //         throw new ConflictException('Legal name already exist.');
// //       }
// //     }

// //     //Registar en la DB la nueva empresa
// //     const company = new Company();
// //     company.trade_name = newRegister.trade_name;
// //     company.legal_name = newRegister.legal_name;
// //     company.email = newRegister.email;
// //     company.logo = newRegister.logo_url;
// //     company.phone_number = newRegister.phone_number;
// //     company.address = newRegister.address;

// //     await this.companiesRepository.save(company);

// //     const companySaved = await this.companiesRepository.findOne({
// //       where: { id: company.id }
// //     });

// //     if (!companySaved) {
// //       throw new NotFoundException('Error, Company not found after register.');
// //     }

// //     //Encontrar el Plan en la DB
// //     const plan = await this.plansRepository.findOne({
// //       where: { id: newRegister.plan_id }
// //     });

// //     if (!plan) {
// //       throw new NotFoundException('Error, Plan id not found.');
// //     }

// //     //Fechas
// //     const currentDate = new Date();
// //     const futureDate = new Date(currentDate);
// //     futureDate.setDate(currentDate.getDate() + plan.duration_days);

// //     //Registar en la DB una nueva Suscripcion
// //     const newSuscripcion = new Suscripcion();
// //     newSuscripcion.company = companySaved;
// //     newSuscripcion.plan = plan;
// //     newSuscripcion.start_date = currentDate;
// //     newSuscripcion.end_date = futureDate;

// //     await this.suscriptionsRepository.save(newSuscripcion);

// //     //Encontral el Rol en la DB
// //     const rol = await this.rolesRepository.findOne({
// //       where: { name: Role.COMPANY_OWNER }
// //     });

// //     if (!rol) {
// //       throw new NotFoundException('Error, rol is not valid.');
// //     }

// //     //Registar al usuario en la DB
// //     const userFound = await this.usersRepository.findOne({
// //       where: { email: newRegister.email }
// //     });

// //     if (userFound) {
// //       throw new ConflictException('Email already exist.');
// //     }

// //     // Registro en Clerk
// //     const clearkUser = await this.clerkService.createUser(
// //       newRegister.email,
// //       newRegister.password,
// //       newRegister.name
// //     );

// //     const newUser = new User();
// //     newUser.clerkId = clearkUser.id;
// //     newUser.email = newRegister.email;
// //     newUser.first_name = newRegister.name;
// //     newUser.role = rol;
// //     newUser.company = companySaved;
// //     newUser.created_at = currentDate;
// //     newUser.updated_at = currentDate;

// //     await this.usersRepository.save(newUser);

// //     return {
// //       message: 'Register successfully.'
// //     };
// //   }

// //   //-------------Perfil de usuario-------------//
// //   async getAuthUser(clerkId: string) {
// //     const userLogin = await this.usersRepository.findOne({
// //       where: { clerkId: clerkId },
// //       relations: { company: true, role: true }
// //     });

// //     if (!userLogin) {
// //       throw new NotFoundException('User not found in DB.');
// //     }

// //     return {
// //       message: 'User loguin.',
// //       user: userLogin
// //     };
// //   }

// //   //-------------Perfil de usuario y JWT-------------//
// //   async getUserWithJwt(email: string) {
// //     const userLogin = await this.usersRepository.findOne({
// //       where: { email },
// //       relations: { company: true, role: true }
// //     });

// //     if (!userLogin) {
// //       throw new NotFoundException('User not found in DB.');
// //     }

// //     const payload = {
// //       id: userLogin.id,
// //       email: userLogin.email,
// //       name: userLogin.first_name,
// //       rol: userLogin.role.name,
// //       companyId: userLogin.company.id
// //     };

// //     const appToken = this.jwtService.sign(payload);

// //     return { user: userLogin, appToken };
// //   }
// // }

// //corregido con cursor
// import {
//   ConflictException,
//   Injectable,
//   NotFoundException
// } from '@nestjs/common';
// import { ClerkService } from './clerk.service';
// import { InjectRepository } from '@nestjs/typeorm';
// import { CreateRegisterDto } from './dto/create-register.dto';
// import { Repository, DataSource } from 'typeorm';
// import { Company } from 'src/empresa/entities/empresa.entity';
// import { User } from 'src/user/entities/user.entity';
// import { Plan } from 'src/plan/entities/plan.entity';
// import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
// import { Rol } from 'src/rol/entities/rol.entity';
// import { Role } from 'src/rol/enums/role.enum';

// import { JwtService } from '@nestjs/jwt';

// @Injectable()
// export class AuthService {
//   constructor(
//     @InjectRepository(User)
//     private readonly usersRepository: Repository<User>,
//     @InjectRepository(Company)
//     private readonly companiesRepository: Repository<Company>,
//     @InjectRepository(Plan)
//     private readonly plansRepository: Repository<Plan>,
//     @InjectRepository(Suscripcion)
//     private readonly suscriptionsRepository: Repository<Suscripcion>,
//     @InjectRepository(Rol)
//     private readonly rolesRepository: Repository<Rol>,
//     private readonly clerkService: ClerkService,
//     private readonly jwtService: JwtService,
//     private readonly dataSource: DataSource
//   ) {}

//   //-------------Crear Registro-------------//
//   async create(newRegister: CreateRegisterDto) {
//     return await this.dataSource.transaction(async (manager) => {
//       try {
//         //Validar que no exista la empresa
//         const companyFound: Company | null = await manager.findOne(Company, {
//           where: [
//             { email: newRegister.email },
//             { legal_name: newRegister.legal_name }
//           ]
//         });

//         if (companyFound) {
//           if (companyFound.email === newRegister.email) {
//             throw new ConflictException('Email already exist.');
//           } else if (companyFound.legal_name === newRegister.legal_name) {
//             throw new ConflictException('Legal name already exist.');
//           }
//         }

//         //Registar en la DB la nueva empresa
//         const company = new Company();
//         company.trade_name = newRegister.trade_name;
//         company.legal_name = newRegister.legal_name;
//         company.email = newRegister.email;
//         company.logo = newRegister.logo_url;
//         company.phone_number = newRegister.phone_number;
//         company.address = newRegister.address;

//         const savedCompany = await manager.save(Company, company);

//         if (!savedCompany) {
//           throw new NotFoundException('Error, Company not found after register.');
//         }

//         //Encontrar el Plan en la DB
//         const plan = await manager.findOne(Plan, {
//           where: { id: newRegister.plan_id }
//         });

//         if (!plan) {
//           throw new NotFoundException('Error, Plan id not found.');
//         }

//         //Fechas
//         const currentDate = new Date();
//         const futureDate = new Date(currentDate);
//         futureDate.setDate(currentDate.getDate() + plan.duration_days);

//         //Registar en la DB una nueva Suscripcion
//         const newSuscripcion = new Suscripcion();
//         newSuscripcion.company = savedCompany;
//         newSuscripcion.plan = plan;
//         newSuscripcion.start_date = currentDate;
//         newSuscripcion.end_date = futureDate;

//         await manager.save(Suscripcion, newSuscripcion);

//         //Encontral el Rol en la DB
//         const rol = await manager.findOne(Rol, {
//           where: { name: Role.COMPANY_OWNER }
//         });

//         if (!rol) {
//           throw new NotFoundException('Error, rol is not valid.');
//         }

//         //Registar al usuario en la DB
//         const userFound = await manager.findOne(User, {
//           where: { email: newRegister.email }
//         });

//         if (userFound) {
//           throw new ConflictException('Email already exist.');
//         }

//         // Registro en Clerk
//         const clearkUser = await this.clerkService.createUser(
//           newRegister.email,
//           newRegister.password,
//           newRegister.name
//         );

//         const newUser = new User();
//         newUser.clerkId = clearkUser.id;
//         newUser.email = newRegister.email;
//         newUser.first_name = newRegister.name;
//         newUser.role = rol;
//         newUser.company = savedCompany;
//         newUser.created_at = currentDate;
//         newUser.updated_at = currentDate;

//         await manager.save(User, newUser);

//         return {
//           message: 'Register successfully.'
//         };

//       } catch (error) {
//         // Si cualquier paso falla, TODO se revierte automáticamente
//         console.error('Error en registro:', error);
//         throw error;
//       }
//     });
//   }

//   //-------------Perfil de usuario-------------//
//   async getAuthUser(clerkId: string) {
//     const userLogin = await this.usersRepository.findOne({
//       where: { clerkId: clerkId },
//       relations: { company: true, role: true }
//     });

//     if (!userLogin) {
//       throw new NotFoundException('User not found in DB.');
//     }

//     return {
//       message: 'User loguin.',
//       user: userLogin
//     };
//   }

//   //-------------Perfil de usuario y JWT-------------//
//   async getUserWithJwt(email: string) {
//     const userLogin = await this.usersRepository.findOne({
//       where: { email },
//       relations: { company: true, role: true }
//     });

//     if (!userLogin) {
//       throw new NotFoundException('User not found in DB.');
//     }

//     const payload = {
//       id: userLogin.id,
//       email: userLogin.email,
//       name: userLogin.first_name,
//       rol: userLogin.role.name,
//       companyId: userLogin.company.id
//     };

//     const appToken = this.jwtService.sign(payload);

//     return { user: userLogin, appToken };
//   }
// }

//cambio con cursor de prueba, company + user registrados

import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRegisterDto } from './dto/create-register.dto';
import { Repository, DataSource } from 'typeorm';
import { Company } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/user/entities/user.entity';
import { Plan } from 'src/plan/entities/plan.entity';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
import { Rol } from 'src/rol/entities/rol.entity';
import { Role } from 'src/rol/enums/role.enum';
import { Plans } from 'src/plan/enums/plan.enum';
import { JwtService } from '@nestjs/jwt';
import { DepartamentoService } from 'src/departamento/departamento.service';
import { PositionService } from 'src/position/position.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
    @InjectRepository(Suscripcion)
    private readonly suscriptionsRepository: Repository<Suscripcion>,
    @InjectRepository(Rol)
    private readonly rolesRepository: Repository<Rol>,
    private readonly clerkService: ClerkService,
    private readonly jwtService: JwtService,
    private readonly departamentoService: DepartamentoService,
    private readonly positionService: PositionService,
    private readonly dataSource: DataSource
  ) {}

  //-------------Crear Registro-------------//
  async create(newRegister: CreateRegisterDto) {
    return await this.dataSource.transaction(async (manager) => {
      try {
        //Validar que no exista la empresa
        const companyFound: Company | null = await manager.findOne(Company, {
          where: [
            { email: newRegister.email },
            { legal_name: newRegister.legal_name }
          ]
        });

        if (companyFound) {
          if (companyFound.email === newRegister.email) {
            throw new ConflictException('Email already exist.');
          } else if (companyFound.legal_name === newRegister.legal_name) {
            throw new ConflictException('Legal name already exist.');
          }
        }

        //Registar en la DB la nueva empresa
        const company = new Company();
        company.trade_name = newRegister.trade_name;
        company.legal_name = newRegister.legal_name;
        company.email = newRegister.email;
        company.logo = newRegister.logo_url;
        company.phone_number = newRegister.phone_number;
        company.address = newRegister.address;
        company.country = newRegister.country;

        const savedCompany = await manager.save(Company, company);

        if (!savedCompany) {
          throw new NotFoundException(
            'Error, Company not found after register.'
          );
        }

        //Encontrar el Plan en la DB
        const plan = await manager.findOne(Plan, {
          where: { name: Plans.FREE }
        });

        if (!plan) {
          throw new NotFoundException('Error, Plan Free not found.');
        }

        //Fechas
        const currentDate = new Date();
        const futureDate = new Date(currentDate);
        futureDate.setDate(currentDate.getDate() + plan.duration_days);

        //Registar en la DB una nueva Suscripcion
        const newSuscripcion = new Suscripcion();
        newSuscripcion.company = savedCompany;
        newSuscripcion.plan = plan;
        newSuscripcion.start_date = currentDate;
        newSuscripcion.end_date = futureDate;

        await manager.save(Suscripcion, newSuscripcion);

        //Encontral el Rol en la DB
        const rol = await manager.findOne(Rol, {
          where: { name: Role.COMPANY_OWNER }
        });

        if (!rol) {
          throw new NotFoundException('Error, rol is not valid.');
        }

        //Registar al usuario en la DB
        const userFound = await manager.findOne(User, {
          where: { email: newRegister.email }
        });

        if (userFound) {
          throw new ConflictException('Email already exist.');
        }

        // Registro en Clerk
        const clerkUser = await this.clerkService.createUser(
          newRegister.email,
          newRegister.password,
          newRegister.name
        );

        const newUser = new User();
        newUser.clerkId = clerkUser.id;
        newUser.email = newRegister.email;
        newUser.first_name = newRegister.name;
        newUser.role = rol;
        newUser.company = savedCompany;
        newUser.created_at = currentDate;
        newUser.updated_at = currentDate;

        await manager.save(User, newUser);
        await this.departamentoService.seeder(savedCompany.id, manager);
        await this.positionService.seeder(savedCompany.id, manager);

        return {
          message: 'Register successfully.'
        };
      } catch (error) {
        // Si cualquier paso falla, TODO se revierte automáticamente
        console.error('Error en registro:', error);
        throw error;
      }
    });
  }

  //-------------Perfil de usuario-------------//
  async getAuthUser(clerkId: string) {
    const userLogin = await this.usersRepository.findOne({
      where: { clerkId: clerkId },
      relations: { company: true, role: true }
    });

    if (!userLogin) {
      throw new NotFoundException('User not found in DB.');
    }

    return {
      message: 'User loguin.',
      user: userLogin
    };
  }
}
