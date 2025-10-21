import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from './enums/role.enum';

@ApiTags('Rol')
@Controller('rol')
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo rol',
    description: 'Registra un nuevo rol en el sistema'
  })
  @ApiBody({
    type: CreateRolDto,
    description: 'Datos del rol a crear'
  })
  @ApiResponse({
    status: 201,
    description: 'Rol creado exitosamente'
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolService.create(createRolDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los roles',
    description: 'Retorna una lista de todos los roles registrados'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles obtenida exitosamente'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  findAll() {
    return this.rolService.findAll();
  }

  @Get('seeder')
  @ApiOperation({
    summary: 'Ejecutar seeder de roles',
    description: 'Carga roles predefinidos en el sistema'
  })
  @ApiResponse({
    status: 200,
    description: 'Seeder ejecutado exitosamente'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  seeder() {
    return this.rolService.seeder();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener rol por ID',
    description: 'Retorna la información completa de un rol específico'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Rol encontrado exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido'
  })
  findOne(@Param('id') id: string) {
    return this.rolService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar rol',
    description: 'Actualiza la información de un rol existente'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateRolDto,
    description: 'Campos del rol a actualizar (todos opcionales)'
  })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente'
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  update(@Param('id') id: string, @Body() updateRolDto: UpdateRolDto) {
    return this.rolService.update(id, updateRolDto);
  }

  @Roles(Role.SUPER_ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar rol',
    description: 'Elimina un rol del sistema'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del rol a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Rol eliminado exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Rol no encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido'
  })
  remove(@Param('id') id: string) {
    return this.rolService.remove(id);
  }
}
