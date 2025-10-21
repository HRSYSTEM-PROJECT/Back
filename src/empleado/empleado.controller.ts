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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UseInterceptors } from '@nestjs/common';
import { UploadedFile } from '@nestjs/common';
import { UploadService } from 'src/upload/upload.service';
import { Employee } from './entities/empleado.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/rol/enums/role.enum';

@ApiTags('Empleado')
@Controller('empleado')
export class EmpleadoController {
  constructor(
    private readonly empleadoService: EmpleadoService,
    private readonly uploadService: UploadService
  ) {}
  //-----Encontrar todos los empleados del sistema----//
  @Roles(Role.SUPER_ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Get()
  @ApiOperation({
    summary: 'Obtener todos los empleados',
    description:
      'Retorna una lista de todos los empleados registrados en el sistema'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async findAll(): Promise<Employee[]> {
    return this.empleadoService.findAll();
  }

  //------------ Agregar Empleados -----------------//
  @UseGuards(ClerkAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo empleado',
    description:
      'Registra un nuevo empleado en el sistema. La empresa se obtiene automáticamente del usuario autenticado.'
  })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Empleado creado exitosamente' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return cb(new Error('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      }
    })
  )
  async create(
    @Req() req: AuthRequest,
    @Body() dto: CreateEmployeeDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (file) {
      const imageUrl = await this.uploadService.uploadImage(file);
      dto.imgUrl = imageUrl;
    }

    return this.empleadoService.create(dto, req.user);
  }

  // ✅ Obtener todos los empleados de una empresa
  @UseGuards(ClerkAuthGuard)
  @Get('/byCompany')
  @ApiOperation({
    summary: 'Obtener todos los empleados de una empresa',
    description:
      'Retorna una lista de todos los empleados registrados de una empresa en particular'
  })
  @ApiResponse({ status: 200, description: 'Lista de empleados obtenida' })
  async findAllByCompany(@Req() req: AuthRequest) {
    return this.empleadoService.findAllByCompany(req.user);
  }

  // ✅ Buscar empleados (filtro)
  @UseGuards(ClerkAuthGuard)
  @Get('/search')
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

  // ✅ Buscar por ID
  @UseGuards(ClerkAuthGuard)
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

  // ✅ Actualizar empleado
  @UseGuards(ClerkAuthGuard)
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
  @UseGuards(ClerkAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar empleado',
    description: 'Elimina un empleado del sistema (soft delete)'
  })
  async remove(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.empleadoService.remove(id, req.user);
  }

  // ✅ Ausencias del empleado
  @UseGuards(ClerkAuthGuard)
  @Get(':id/ausencias')
  @ApiOperation({
    summary: 'Obtener ausencias por empleado',
    description:
      'Devuelve las ausencias de un empleado según mes y año (opcional).'
  })
  // async getAusenciasByEmpleado(
  //   @Param('id') employeeId: string,
  //   @Req() req: AuthRequest,
  //   @Query('month') month?: number,
  //   @Query('year') year?: number
  // ) {
  //   return this.empleadoService.getAusenciasByEmpleado(
  //     employeeId,
  //     req.user,
  //     month,
  //     year
  //   );
  // }
  async getAusenciasByEmpleado(
    @Param('id') employeeId: string,
    @Req() req: AuthRequest,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.empleadoService.getAusenciasByEmpleado(
      employeeId,
      req.user,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );
  }
}
