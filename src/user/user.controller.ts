import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
import type { AuthRequest } from 'src/interfaces/authrequest.interface';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(ClerkAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo usuario',
    description:
      'Registra un nuevo usuario en el sistema con rol y empresa asociada'
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Datos del usuario a crear'
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está registrado'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  create(@Body() createUserDto: CreateUserDto, @Req() req: AuthRequest) {
    return this.userService.create(createUserDto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los usuarios',
    description:
      'Retorna una lista de todos los usuarios registrados en el sistema'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    type: [UserResponseDto]
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @UseGuards(ClerkAuthGuard)
  @Get('/byCompany')
  @ApiOperation({
    summary: 'Obtener todos los usuarios de una Empresa',
    description:
      'Retorna una lista de todos los usuarios registrados en la empresa del usuario logueado'
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    type: [UserResponseDto]
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async findAllByCompany(@Req() req: AuthRequest): Promise<User[]> {
    const { companyId } = req.user;
    return this.userService.findAllByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Retorna la información completa de un usuario específico'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado exitosamente',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido'
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description:
      'Actualiza la información de un usuario existente. Solo se actualizan los campos enviados.'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario a actualizar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Campos del usuario a actualizar (todos opcionales)'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
    type: UserResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado'
  })
  @ApiResponse({
    status: 409,
    description: 'El email ya está registrado por otro usuario'
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar usuario',
    description: 'Elimina un usuario del sistema (soft delete)'
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del usuario a eliminar',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente'
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado'
  })
  @ApiResponse({
    status: 400,
    description: 'ID inválido'
  })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
