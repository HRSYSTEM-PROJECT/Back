import {
  Get,
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req
} from '@nestjs/common';
import { Patch } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { CreateCompanyDto } from './dto/create-empresa.dto';
import { UpdateCompanyDto } from './dto/update-empresa.dto';
import { ParseUUIDPipe } from '@nestjs/common';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
import type { AuthRequest } from 'src/interfaces/authrequest.interface';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/rol/enums/role.enum';

@ApiTags('Empresa - Gestión de Empresas')
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  // @Post()
  // @ApiOperation({
  //   summary: 'Crear nueva empresa',
  //   description:
  //     'Registra una nueva empresa en el sistema con sus datos comerciales y legales'
  // })
  // @ApiBody({
  //   type: CreateCompanyDto,
  //   description: 'Datos de la empresa a crear'
  // })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Empresa creada exitosamente'
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Datos de entrada inválidos'
  // })
  // @ApiResponse({
  //   status: 409,
  //   description: 'La razón social ya está registrada'
  // })
  // @ApiResponse({
  //   status: 500,
  //   description: 'Error interno del servidor'
  // })
  // create(@Body() createEmpresaDto: CreateCompanyDto) {
  //   return this.empresaService.create(createEmpresaDto);
  // }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Get()
  @ApiOperation({
    summary: 'Obtener todas las empresas',
    description:
      'Retorna una lista de todas las empresas registradas en el sistema'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de empresas obtenida exitosamente'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  findAll() {
    return this.empresaService.findAll();
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener empresa por ID',
    description: 'Retorna la información completa de una empresa específica'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la empresa',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa encontrada exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa no encontrada'
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido'
  })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    // Si id no es UUID válido, Nest lanzará automáticamente un BadRequestException
    return this.empresaService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.COMPANY_OWNER)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar empresa',
    description:
      'Actualiza la información de una empresa existente. Solo se actualizan los campos enviados.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la empresa a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateCompanyDto,
    description: 'Campos de la empresa a actualizar (todos opcionales)'
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa actualizada exitosamente'
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa no encontrada'
  })
  @ApiResponse({
    status: 409,
    description: 'La razón social ya está registrada por otra empresa'
  })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.empresaService.update(id, updateCompanyDto);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar empresa',
    description: 'Elimina una empresa del sistema (soft delete)'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la empresa a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Empresa eliminada exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Empresa no encontrada'
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido'
  })
  remove(@Param('id') id: string) {
    return this.empresaService.remove(id);
  }
}
