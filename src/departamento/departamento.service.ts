// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { CreateDepartamentoDto } from './dto/create-departamento.dto';
// import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
// import { Departamento } from './entities/departamento.entity';
// import { departments_data } from './data/department.data';

// @Injectable()
// export class DepartamentoService {
//   constructor(
//     @InjectRepository(Departamento)
//     private readonly departamentoRepository: Repository<Departamento>
//   ) {}

//   async create(
//     createDepartamentoDto: CreateDepartamentoDto
//   ): Promise<Departamento> {
//     const departamento = this.departamentoRepository.create(
//       createDepartamentoDto
//     );
//     return await this.departamentoRepository.save(departamento);
//   }

//   async findAll(): Promise<Departamento[]> {
//     return await this.departamentoRepository.find({
//       order: { createdAt: 'DESC' }
//     });
//   }

//   async seeder() {
//     //Leer data y guardarla en la DB
//     await this.departamentoRepository.upsert(departments_data, ['nombre']);

//     return { message: 'Departments seeded successfully.' };
//   }

//   async findOne(id: string): Promise<Departamento> {
//     const departamento = await this.departamentoRepository.findOne({
//       where: { id }
//     });

//     if (!departamento) {
//       throw new Error('Departamento no encontrado');
//     }

//     return departamento;
//   }

//   async update(
//     id: string,
//     updateDepartamentoDto: UpdateDepartamentoDto
//   ): Promise<Departamento> {
//     await this.departamentoRepository.update(id, updateDepartamentoDto);
//     return this.findOne(id);
//   }

//   async remove(id: string): Promise<void> {
//     await this.departamentoRepository.softDelete(id);
//   }
// }

//Refactor para multiempresa(se filtra todo por empresaId)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departamento } from './entities/departamento.entity';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
import { departments_data } from './data/department.data';

@Injectable()
export class DepartamentoService {
  constructor(
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>
  ) {}

  async create(dto: CreateDepartamentoDto, companyId: string): Promise<Departamento> {
    const departamento = this.departamentoRepository.create({ ...dto, companyId });
    return await this.departamentoRepository.save(departamento);
  }

  async findAll(companyId: string): Promise<Departamento[]> {
    return await this.departamentoRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' }
    });
  }

  async seeder(companyId: string) {
    const existentes = await this.departamentoRepository.find({ where: { companyId } });

    const nuevos = departments_data
      .filter((d) => !existentes.some((e) => e.nombre === d.nombre))
      .map((d) => ({ ...d, companyId }));

    if (nuevos.length > 0) {
      await this.departamentoRepository.save(nuevos);
    }

    return { message: 'Departamentos cargados para la empresa.' };
  }

  async findOne(id: string, companyId: string): Promise<Departamento> {
    const departamento = await this.departamentoRepository.findOne({
      where: { id, companyId }
    });

    if (!departamento) {
      throw new Error('Departamento no encontrado');
    }

    return departamento;
  }

  async update(id: string, dto: UpdateDepartamentoDto, companyId: string): Promise<Departamento> {
    const departamento = await this.findOne(id, companyId);
    await this.departamentoRepository.update(id, dto);
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const departamento = await this.findOne(id, companyId);
    await this.departamentoRepository.softDelete(id);
  }
}
