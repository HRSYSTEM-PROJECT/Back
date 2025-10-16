import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Rol } from 'src/rol/entities/rol.entity';
import { Company } from 'src/empresa/entities/empresa.entity';
import { Employee } from 'src/empleado/entities/empleado.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { NotificationConfig } from '../../notifications/entities/notification-config.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true
  })
  clerkId: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: false
  })
  first_name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    unique: false
  })
  last_name: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: false
  })
  profile_image_url: string | null;

  @ManyToOne(() => Rol, (rol) => rol.users, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Rol;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Employee, (employee) => employee.user, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  updated_at: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true
  })
  deleted_at?: Date | null;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => NotificationConfig, (config) => config.user)
  notification_configs: NotificationConfig[];
}

//cambio un user muchos empleados
// import {
//   Column,
//   CreateDateColumn,
//   DeleteDateColumn,
//   Entity,
//   JoinColumn,
//   ManyToOne,
//   OneToMany,
//   PrimaryGeneratedColumn,
//   UpdateDateColumn
// } from 'typeorm';

// import { Rol } from 'src/rol/entities/rol.entity';
// import { Company } from 'src/empresa/entities/empresa.entity';
// import { Employee } from 'src/empleado/entities/empleado.entity';
// import { Notification } from '../../notifications/entities/notification.entity';
// import { NotificationConfig } from '../../notifications/entities/notification-config.entity';

// @Entity({ name: 'users' })
// export class User {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({
//     type: 'varchar',
//     length: 100,
//     nullable: false,
//     unique: true
//   })
//   clerkId: string;

//   @Column({
//     type: 'varchar',
//     length: 50,
//     nullable: false,
//     unique: true
//   })
//   email: string;

//   @Column({
//     type: 'varchar',
//     length: 50,
//     nullable: false,
//     unique: false
//   })
//   first_name: string;

//   @Column({
//     type: 'varchar',
//     length: 50,
//     nullable: true,
//     unique: false
//   })
//   last_name: string | null;

//   @Column({
//     type: 'varchar',
//     length: 255,
//     nullable: true,
//     unique: false
//   })
//   profile_image_url: string | null;

//   @ManyToOne(() => Rol, (rol) => rol.users, { nullable: false })
//   @JoinColumn({ name: 'role_id' })
//   role: Rol;

//   @ManyToOne(() => Company, (company) => company.users, { nullable: true })
//   @JoinColumn({ name: 'company_id' })
//   company: Company;

//   // ✅ CAMBIO: OneToMany en lugar de ManyToOne
//   @OneToMany(() => Employee, (employee) => employee.user)
//   employees: Employee[];

//   @CreateDateColumn({
//     type: 'timestamp',
//     default: () => 'CURRENT_TIMESTAMP'
//   })
//   created_at: Date;

//   @UpdateDateColumn({
//     type: 'timestamp',
//     default: () => 'CURRENT_TIMESTAMP'
//   })
//   updated_at: Date;

//   @DeleteDateColumn({
//     type: 'timestamp',
//     nullable: true
//   })
//   deleted_at?: Date | null;

//   @OneToMany(() => Notification, (notification) => notification.user)
//   notifications: Notification[];

//   @OneToMany(() => NotificationConfig, (config) => config.user)
//   notification_configs: NotificationConfig[];
// }
