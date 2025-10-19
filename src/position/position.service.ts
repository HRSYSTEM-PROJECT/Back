// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { CreatePositionDto } from './dto/create-position.dto';
// import { UpdatePositionDto } from './dto/update-position.dto';
// import { PositionResponseDto } from './dto/position-response.dto';
// import { Position } from './entities/position.entity';
// import { positions_data } from './data/position.data';

// @Injectable()
// export class PositionService {
//   constructor(
//     @InjectRepository(Position)
//     private readonly positionRepository: Repository<Position>
//   ) {}

//   async create(
//     createPositionDto: CreatePositionDto
//   ): Promise<PositionResponseDto> {
//     const position = this.positionRepository.create(createPositionDto);
//     const savedPosition = await this.positionRepository.save(position);

//     return {
//       id: savedPosition.id,
//       name: savedPosition.name,
//       description: savedPosition.description,
//       createdAt: savedPosition.createdAt,
//       updatedAt: savedPosition.updatedAt
//     };
//   }

//   async findAll(): Promise<PositionResponseDto[]> {
//     const positions = await this.positionRepository.find({
//       order: { name: 'ASC' }
//     });

//     return positions.map((position) => ({
//       id: position.id,
//       name: position.name,
//       description: position.description,
//       createdAt: position.createdAt,
//       updatedAt: position.updatedAt
//     }));
//   }

//   async seeder() {
//     //Leer data y guardarla en la DB
//     await this.positionRepository.upsert(positions_data, ['name']);

//     return { message: 'Positions seeded successfully.' };
//   }

//   async findOne(id: string): Promise<PositionResponseDto> {
//     const position = await this.positionRepository.findOne({
//       where: { id }
//     });

//     if (!position) {
//       throw new Error('Puesto no encontrado');
//     }

//     return {
//       id: position.id,
//       name: position.name,
//       description: position.description,
//       createdAt: position.createdAt,
//       updatedAt: position.updatedAt
//     };
//   }

//   async update(
//     id: string,
//     updatePositionDto: UpdatePositionDto
//   ): Promise<PositionResponseDto> {
//     await this.positionRepository.update(id, updatePositionDto);
//     return this.findOne(id);
//   }

//   async remove(id: string): Promise<void> {
//     await this.positionRepository.softDelete(id);
//   }
// }

//refactor multiempresa
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionResponseDto } from './dto/position-response.dto';
import { Position } from './entities/position.entity';
import { positions_data } from './data/position.data';

@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>
  ) {}

  async create(createPositionDto: CreatePositionDto, empresaId: string, manager?: EntityManager): Promise<PositionResponseDto> {
    const repo = manager ? manager.getRepository(Position) : this.positionRepository;
    const position = repo.create({ ...createPositionDto, empresaId });
    const savedPosition = await repo.save(position);

    return {
      id: savedPosition.id,
      name: savedPosition.name,
      description: savedPosition.description,
      createdAt: savedPosition.createdAt,
      updatedAt: savedPosition.updatedAt
    };
  }

  async findAll(empresaId: string): Promise<PositionResponseDto[]> {
    const positions = await this.positionRepository.find({
      where: { empresaId },
      order: { name: 'ASC' }
    });

    return positions.map((position) => ({
      id: position.id,
      name: position.name,
      description: position.description,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt
    }));
  }

  async seeder(empresaId: string, manager?: EntityManager) {
    const repo = manager? manager.getRepository(Position): this.positionRepository;
    const existentes = await repo.find({ where: { empresaId } });

    const nuevos = positions_data
      .filter((p) => !existentes.some((e) => e.name === p.name))
      .map((p) => ({ ...p, empresaId }));

    if (nuevos.length > 0) {
      await repo.save(nuevos);
    }

    return { message: 'Puestos cargados para la empresa.' };
  }

  async findOne(id: string, empresaId: string): Promise<PositionResponseDto> {
    const position = await this.positionRepository.findOne({
      where: { id, empresaId }
    });

    if (!position) {
      throw new Error('Puesto no encontrado');
    }

    return {
      id: position.id,
      name: position.name,
      description: position.description,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt
    };
  }

  async update(id: string, updatePositionDto: UpdatePositionDto, empresaId: string): Promise<PositionResponseDto> {
    const position = await this.findOne(id, empresaId);
    await this.positionRepository.update(id, updatePositionDto);
    return this.findOne(id, empresaId);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const position = await this.findOne(id, empresaId);
    await this.positionRepository.softDelete(id);
  }
}
