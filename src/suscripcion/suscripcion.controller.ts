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
import { SuscripcionService } from './suscripcion.service';
import { CreateSuscripcionDto } from './dto/create-suscripcion.dto';
import { UpdateSuscripcionDto } from './dto/update-suscripcion.dto';
import { CreateSubscriptionRequestDto } from './dto/create-subscription-request.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/guards/clerk.guard';
import type { Request } from 'express';
import type { AuthRequest } from 'src/interfaces/authrequest.interface';

@ApiTags('Suscripciones')
@Controller('suscripciones')
export class SuscripcionController {
  constructor(private readonly suscripcionService: SuscripcionService) {}

  @UseGuards(ClerkAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Crear una nueva suscripción',
    description: 'Crea una suscripción nueva para la empresa autenticada'
  })
  @ApiBody({ type: CreateSubscriptionRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Suscripción creada exitosamente',
    type: SubscriptionResponseDto
  })
  @ApiResponse({
    status: 409,
    description: 'La empresa ya tiene una suscripción activa',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'La empresa ya tiene una suscripción activa.'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  async createSubscription(
    @Body() createSubscriptionDto: CreateSubscriptionRequestDto,
    @Req() req: Request
  ): Promise<SubscriptionResponseDto> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new Error('Usuario no autenticado o sin empresa');
    }
    return this.suscripcionService.createSubscription(
      createSubscriptionDto,
      companyId
    );
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las suscripciones' })
  @ApiResponse({
    status: 200,
    description: 'Lista de suscripciones obtenida exitosamente',
    type: [CreateSuscripcionDto]
  })
  findAll() {
    return this.suscripcionService.findAll();
  }

  //-----Encontrar todas las suscripciones de una empresa---//
  @UseGuards(ClerkAuthGuard)
  @Get('company')
  @ApiOperation({
    summary: 'Suscripciones de una empresa.',
    description:
      'Devuelve todas las suscripciones de una empresa en particular.'
  })
  @ApiResponse({ status: 200, description: 'Suscriptions found' })
  async getCompanySuscriptions(@Req() req: AuthRequest) {
    const { companyId } = req.user;
    return this.suscripcionService.getCompanySuscriptions(companyId);
  }

  //-----Encontrar la suscripcion actual de una empresa---//
  @UseGuards(ClerkAuthGuard)
  @Get('company/current')
  @ApiOperation({
    summary: 'Suscripcion actual de una empresa.',
    description: 'Devuelve la suscripcion actual de una empresa en particular.'
  })
  @ApiResponse({ status: 200, description: 'Current Suscription found' })
  async getCompanyCurrentSuscription(@Req() req: AuthRequest) {
    const { companyId } = req.user;
    return this.suscripcionService.getCompanyCurrentSuscription(companyId);
  }

  //-----Añadir/"cambiar" la suscripcion actual de la empresa---//
  @UseGuards(ClerkAuthGuard)
  @Post('/company')
  @ApiOperation({
    summary: 'Añadir/"cambiar" suscripcion actual de una empresa.',
    description:
      'Añade una suscripcion nueva a la empresa, que comenzará una vez termine la suscripcion actual.'
  })
  @ApiResponse({ status: 201, description: 'Suscription Changed.' })
  async addCompanySuscription(
    @Req() req: AuthRequest,
    @Body() planId: CreateSubscriptionRequestDto
  ) {
    const { companyId } = req.user;
    return this.suscripcionService.addCompanySuscription(companyId, planId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una suscripción por ID' })
  @ApiParam({ name: 'id', description: 'ID de la suscripción', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Suscripción encontrada exitosamente',
    type: CreateSuscripcionDto
  })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada' })
  findOne(@Param('id') id: string) {
    return this.suscripcionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una suscripción' })
  @ApiParam({ name: 'id', description: 'ID de la suscripción', type: 'string' })
  @ApiBody({ type: UpdateSuscripcionDto })
  @ApiResponse({
    status: 200,
    description: 'Suscripción actualizada exitosamente',
    type: CreateSuscripcionDto
  })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  update(
    @Param('id') id: string,
    @Body() updateSuscripcionDto: UpdateSuscripcionDto
  ) {
    return this.suscripcionService.update(id, updateSuscripcionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una suscripción' })
  @ApiParam({ name: 'id', description: 'ID de la suscripción', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Suscripción eliminada exitosamente'
  })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada' })
  remove(@Param('id') id: string) {
    return this.suscripcionService.remove(id);
  }
}
