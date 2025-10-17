//uso del guard authuser con clerk
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import type { AuthRequest } from 'src/interfaces/authrequest.interface';
import { EmpleadoService } from './empleado.service';
import { CreateEmployeeDto } from './dto/create-empleado.dto';
import { UpdateEmployeeDto } from './dto/update-empleado.dto';
import { SearchEmpleadoDto } from './dto/search-empleado.dto';
import { AuthUser } from 'src/decoradores/auth-user.decoratos';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
import { User } from 'src/user/entities/user.entity';

@ApiTags('Empleado')
@UseGuards(ClerkAuthGuard) // 👈 aplica el guard a TODO el controller
@Controller('empleado')
export class EmpleadoController {
  constructor(private readonly empleadoService: EmpleadoService) {}

  // ✅ Crear empleado
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo empleado',
    description:
      'Registra un nuevo empleado en el sistema. La empresa se obtiene automáticamente del usuario autenticado.'
  })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  // async create(@AuthUser() user: any, @Body() dto: CreateEmployeeDto) {
  //   return this.empleadoService.create(dto, user);
  async create(@Req() req: AuthRequest, @Body() dto: CreateEmployeeDto) {
    return this.empleadoService.create(dto, req.user);
  }

  // ✅ Obtener todos los empleados
  @Get()
  @ApiOperation({
    summary: 'Obtener todos los empleados',
    description: 'Retorna una lista de todos los empleados registrados'
  })
  @ApiResponse({ status: 200, description: 'Lista de empleados obtenida' })
  async findAll(@Req() req: AuthRequest) {
    return this.empleadoService.findAll(req.user);
  }

  // ✅ Buscar por ID
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener empleado por ID',
    description: 'Retorna la información completa de un empleado específico'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del empleado',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.empleadoService.findOne(id, req.user);
  }

  // ✅ Buscar empleados (filtro)
  @Get('search')
  @ApiOperation({
    summary: 'Buscar empleados',
    description:
      'Busca empleados según criterios (nombre, apellido, email, etc.)'
  })
  async searchEmpleados(
    @Req() req: AuthRequest,
    @Query() searchDto: SearchEmpleadoDto
  ) {
    return this.empleadoService.search(req.user, searchDto);
  }

  // ✅ Actualizar empleado
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar empleado',
    description:
      'Actualiza la información de un empleado existente. Solo se actualizan los campos enviados.'
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @Req() req: AuthRequest
  ) {
    return this.empleadoService.update(id, dto, req.user);
  }

  // ✅ Eliminar empleado
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar empleado',
    description: 'Elimina un empleado del sistema (soft delete)'
  })
  async remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.empleadoService.remove(id, req.user);
  }

  // ✅ Ausencias del empleado
  @Get(':id/ausencias')
  @ApiOperation({
    summary: 'Obtener ausencias por empleado',
    description:
      'Devuelve las ausencias de un empleado según mes y año (opcional).'
  })
  async getAusenciasByEmpleado(
    @Param('id') employeeId: string,
    @Req() req: AuthRequest,
    @Query('month') month?: number,
    @Query('year') year?: number
  ) {
    return this.empleadoService.getAusenciasByEmpleado(
      employeeId,
      req.user,
      month,
      year
    );
  }
}
