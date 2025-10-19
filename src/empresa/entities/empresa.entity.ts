import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { Employee } from 'src/empleado/entities/empleado.entity';
import { User } from 'src/user/entities/user.entity';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
import { Departamento } from 'src/departamento/entities/departamento.entity';
import { Position } from 'src/position/entities/position.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  stripe_customer_id: string;

  @Column({ nullable: true })
  country?: string;

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

  @OneToOne(() => Suscripcion, (suscripcion) => suscripcion.company)
  @JoinColumn({ name: 'current_subscription_id' })
  suscripciones: Suscripcion;

  @OneToMany(() => Departamento, (departamento) => departamento.company)
departamentos: Departamento[];

@OneToMany(() => Position, (position) => position.company)
positions: Position[];


}
