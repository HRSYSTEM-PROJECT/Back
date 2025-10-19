// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   UpdateDateColumn,
//   DeleteDateColumn,
//   OneToMany
// } from 'typeorm';

// import { Employee } from 'src/empleado/entities/empleado.entity';

// @Entity('positions')
// export class Position {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ unique: true })
//   name: string;

//   @Column({ type: 'text' })
//   description: string;

//   @CreateDateColumn({
//     name: 'created_at',
//     type: 'timestamp',
//     default: () => 'CURRENT_TIMESTAMP'
//   })
//   createdAt: Date;

//   @UpdateDateColumn({
//     name: 'updated_at',
//     type: 'timestamp',
//     default: () => 'CURRENT_TIMESTAMP'
//   })
//   updatedAt: Date;

//   @DeleteDateColumn({
//     name: 'deleted_at',
//     type: 'timestamp',
//     nullable: true
//   })
//   deletedAt?: Date | null;

//   @OneToMany(() => Employee, (employee) => employee.position)
//   employees: Employee[];
// }

//refactor
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany
} from 'typeorm';

import { Employee } from 'src/empleado/entities/empleado.entity';
import { Company } from 'src/empresa/entities/empresa.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  empresaId: string;

  @ManyToOne(() => Company, (company) => company.positions)
  company: Company;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true
  })
  deletedAt?: Date | null;

  @OneToMany(() => Employee, (employee) => employee.position)
  employees: Employee[];
}
