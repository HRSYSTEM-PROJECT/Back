// src/empresa/empresa.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/empresa.entity';
import { CreateCompanyDto } from './dto/create-empresa.dto';
import { UpdateCompanyDto } from './dto/update-empresa.dto';
import { DepartamentoService } from '../departamento/departamento.service';
import { PositionService } from '../position/position.service';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly departamentoService: DepartamentoService,
    private readonly positionService: PositionService
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    
    const company = this.companyRepository.create({
      ...createCompanyDto,
      phone_number: createCompanyDto.phone_number?.toString(), // conversión explícita
      logo: createCompanyDto.logo // mapeo de nombre
    });
    return this.companyRepository.save(company);
  }
  


  async findAll(): Promise<Company[]> {
    return this.companyRepository.find();
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    await this.companyRepository.update(id, {
      ...updateCompanyDto,
      phone_number: updateCompanyDto.phone_number?.toString(),
      logo: updateCompanyDto.logo
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.companyRepository.softDelete(id);
  }
}
