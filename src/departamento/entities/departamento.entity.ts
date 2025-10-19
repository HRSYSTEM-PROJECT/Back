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

// @Entity('departamentos')
// export class Departamento {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ unique: true })
//   nombre: string;

//   @Column({ type: 'text' })
//   descripcion: string;

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

//   @OneToMany(() => Employee, (employee) => employee.department)
//   employees: Employee[];
// }

//refactor: Agregamos la relación con Empresa y eliminamos la restricción de nombre único global

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

@Entity('departamentos')
export class Departamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, (company) => company.departamentos)
  company: Company;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => Employee, (employee) => employee.department)
  employees: Employee[];
}
