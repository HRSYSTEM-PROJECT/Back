import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Employee } from 'src/empleado/entities/empleado.entity';
import { User } from 'src/user/entities/user.entity';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trade_name: string;

  @Column()
  legal_name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  email: string;

   @Column()
  country: string;

  @Column({ type: 'text', nullable: true })
  logo: string | null;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  created_at: Date;

  @UpdateDateColumn({
    name: 'fecha_update',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  update_at: Date;

  @DeleteDateColumn({
    name: 'fecha_deleted',
    type: 'timestamp',
    nullable: true
  })
  deletedAt?: Date | null;

  @OneToMany(() => Employee, (employee) => employee.company)
  employees: Employee[];

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Suscripcion, (suscripcion) => suscripcion.company)
  suscripciones: Suscripcion[];
}
