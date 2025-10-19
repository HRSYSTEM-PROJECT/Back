// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete
// } from '@nestjs/common';
// import {
//   ApiTags,
//   ApiOperation,
//   ApiResponse,
//   ApiParam,
//   ApiBody
// } from '@nestjs/swagger';
// import { PositionService } from './position.service';
// import { CreatePositionDto } from './dto/create-position.dto';
// import { UpdatePositionDto } from './dto/update-position.dto';

// @ApiTags('Position')
// @Controller('position')
// export class PositionController {
//   constructor(private readonly positionService: PositionService) {}

//   @Post()
//   @ApiOperation({
//     summary: 'Crear nuevo puesto',
//     description: 'Registra un nuevo puesto/cargo en el sistema'
//   })
//   @ApiBody({
//     type: CreatePositionDto,
//     description: 'Datos del puesto a crear'
//   })
//   @ApiResponse({
//     status: 201,
//     description: 'Puesto creado exitosamente'
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'Datos de entrada inválidos'
//   })
//   @ApiResponse({
//     status: 500,
//     description: 'Error interno del servidor'
//   })
//   create(@Body() createPositionDto: CreatePositionDto) {
//     return this.positionService.create(createPositionDto);
//   }

//   @Get()
//   @ApiOperation({
//     summary: 'Obtener todos los puestos',
//     description: 'Retorna una lista de todos los puestos/cargos registrados'
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Lista de puestos obtenida exitosamente'
//   })
//   @ApiResponse({
//     status: 500,
//     description: 'Error interno del servidor'
//   })
//   findAll() {
//     return this.positionService.findAll();
//   }

//   @Get('seeder')
//   @ApiOperation({
//     summary: 'Ejecutar seeder de puestos de empleados',
//     description: 'Carga puestos de empleados predefinidos en el sistema'
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Seeder ejecutado exitosamente'
//   })
//   @ApiResponse({
//     status: 500,
//     description: 'Error interno del servidor'
//   })
//   seeder() {
//     return this.positionService.seeder();
//   }

//   @Get(':id')
//   @ApiOperation({
//     summary: 'Obtener puesto por ID',
//     description: 'Retorna la información completa de un puesto específico'
//   })
//   @ApiParam({
//     name: 'id',
//     description: 'UUID del puesto',
//     example: '123e4567-e89b-12d3-a456-426614174000',
//     format: 'uuid'
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Puesto encontrado exitosamente'
//   })
//   @ApiResponse({
//     status: 404,
//     description: 'Puesto no encontrado'
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'ID inválido'
//   })
//   findOne(@Param('id') id: string) {
//     return this.positionService.findOne(id);
//   }

//   @Patch(':id')
//   @ApiOperation({
//     summary: 'Actualizar puesto',
//     description: 'Actualiza la información de un puesto existente'
//   })
//   @ApiParam({
//     name: 'id',
//     description: 'UUID del puesto a actualizar',
//     example: '123e4567-e89b-12d3-a456-426614174000',
//     format: 'uuid'
//   })
//   @ApiBody({
//     type: UpdatePositionDto,
//     description: 'Campos del puesto a actualizar (todos opcionales)'
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Puesto actualizado exitosamente'
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'Datos de entrada inválidos'
//   })
//   @ApiResponse({
//     status: 404,
//     description: 'Puesto no encontrado'
//   })
//   update(
//     @Param('id') id: string,
//     @Body() updatePositionDto: UpdatePositionDto
//   ) {
//     return this.positionService.update(id, updatePositionDto);
//   }

//   @Delete(':id')
//   @ApiOperation({
//     summary: 'Eliminar puesto',
//     description: 'Elimina un puesto del sistema'
//   })
//   @ApiParam({
//     name: 'id',
//     description: 'UUID del puesto a eliminar',
//     example: '123e4567-e89b-12d3-a456-426614174000',
//     format: 'uuid'
//   })
//   @ApiResponse({
//     status: 200,
//     description: 'Puesto eliminado exitosamente'
//   })
//   @ApiResponse({
//     status: 404,
//     description: 'Puesto no encontrado'
//   })
//   @ApiResponse({
//     status: 400,
//     description: 'ID inválido'
//   })
//   remove(@Param('id') id: string) {
//     return this.positionService.remove(id);
//   }
// }

//refactor multitanent
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { PositionService } from './position.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { AuthUser } from 'src/decoradores/auth-user.decoratos';
import type { AuthenticatedUser } from 'src/interfaces/authenticated-user.interface';

@ApiTags('Position')
@Controller('position')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo puesto',
    description: 'Registra un nuevo puesto/cargo en el sistema'
  })
  @ApiBody({
    type: CreatePositionDto,
    description: 'Datos del puesto a crear'
  })
  @ApiResponse({ status: 201, description: 'Puesto creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  create(
    @Body() createPositionDto: CreatePositionDto,
    @AuthUser() user: AuthenticatedUser
  ) {
    return this.positionService.create(createPositionDto, user.companyId);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los puestos',
    description: 'Retorna una lista de todos los puestos/cargos registrados'
  })
  @ApiResponse({ status: 200, description: 'Lista de puestos obtenida exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  findAll(@AuthUser() user: AuthenticatedUser) {
    return this.positionService.findAll(user.companyId);
  }

  @Get('seeder')
  @ApiOperation({
    summary: 'Ejecutar seeder de puestos de empleados',
    description: 'Carga puestos de empleados predefinidos en el sistema'
  })
  @ApiResponse({ status: 200, description: 'Seeder ejecutado exitosamente' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  seeder(@AuthUser() user: AuthenticatedUser) {
    return this.positionService.seeder(user.companyId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener puesto por ID',
    description: 'Retorna la información completa de un puesto específico'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del puesto',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiResponse({ status: 200, description: 'Puesto encontrado exitosamente' })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  findOne(@Param('id') id: string, @AuthUser() user: AuthenticatedUser) {
    return this.positionService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar puesto',
    description: 'Actualiza la información de un puesto existente'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del puesto a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdatePositionDto,
    description: 'Campos del puesto a actualizar (todos opcionales)'
  })
  @ApiResponse({ status: 200, description: 'Puesto actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
    @AuthUser() user: AuthenticatedUser
  ) {
    return this.positionService.update(id, updatePositionDto, user.companyId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar puesto',
    description: 'Elimina un puesto del sistema'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del puesto a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiResponse({ status: 200, description: 'Puesto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Puesto no encontrado' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  remove(@Param('id') id: string, @AuthUser() user: AuthenticatedUser) {
    return this.positionService.remove(id, user.companyId);
  }
}
