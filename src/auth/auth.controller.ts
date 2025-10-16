import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards
} from '@nestjs/common';
import { CreateRegisterDto } from './dto/create-register.dto';
import { ClerkAuthGuard } from './guards/clerk.guard';
import type { AuthRequest } from 'src/interfaces/authrequest.interface';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('onboarding')
  @ApiOperation({
    summary: 'Crear nuevo registro de empresa y usuario',
    description:
      'Registra una empresa nueva desde el formulario, junto con los datos de dueño de la empresa.'
  })
  @ApiBody({ type: CreateRegisterDto })
  @ApiResponse({ status: 201, description: 'Register successfully' })
  async create(@Body() newRegister: CreateRegisterDto) {
    return this.authService.create(newRegister);
  }

  @UseGuards(ClerkAuthGuard)
  @Get('auth/me')
  @ApiOperation({
    summary: 'Perfil usuario logueado.',
    description:
      'Devuelve el perfil de un usuario logueado, así como la relacion con su empresa y su rol.'
  })
  @ApiResponse({ status: 200, description: 'User loguin' })
  async getAuthUser(@Req() req: AuthRequest) {
    const { clerkId } = req.user;
    return this.authService.getAuthUser(clerkId);
  }
}
