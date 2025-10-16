import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateSimpleNotificationDto {
  @ApiProperty({ 
    example: 'Nuevo empleado registrado', 
    description: 'Título de la notificación' 
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    example: 'Se agregó a Juan Pérez al sistema.', 
    description: 'Mensaje de la notificación' 
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ 
    example: 'employee', 
    description: 'Tipo de notificación',
    enum: ['employee', 'payroll', 'productivity', 'category', 'evaluation', 'holiday', 'subscription', 'birthday', 'custom']
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ 
    example: '2025-10-13T16:44:00.000Z', 
    description: 'Fecha y hora de la notificación',
    required: false
  })
  @IsOptional()
  @IsDateString()
  time?: string;

  @ApiProperty({ 
    example: false, 
    description: 'Si la notificación está leída',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
