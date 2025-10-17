import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  Validate,
  IsEnum,
  IsArray,
  IsEmail
} from 'class-validator';
import { IsFutureDateConstraint } from '../validators/is-future-date.validator';
import { RecipientType } from '../entities/scheduled-notification.entity';

export class ScheduleReminderDto {
  @ApiProperty({
    example: 'Reunión importante',
    description: 'Título del recordatorio'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'No olvides la reunión de equipo a las 3 PM',
    description: 'Mensaje del recordatorio'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: '2024-12-25T15:00:00.000Z',
    description: 'Fecha y hora para el recordatorio (debe ser futura)',
    format: 'date-time'
  })
  @IsDateString()
  @IsNotEmpty()
  @Validate(IsFutureDateConstraint)
  scheduledDate: string;

  @ApiProperty({
    example: 'all',
    description: 'Tipo de destinatarios',
    enum: RecipientType,
    default: RecipientType.ALL
  })
  @IsEnum(RecipientType)
  @IsOptional()
  recipientType?: RecipientType = RecipientType.ALL;

  @ApiProperty({
    example: ['empleado1@empresa.com', 'empleado2@empresa.com'],
    description: 'Emails específicos (solo si recipientType es "specific")',
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  recipientEmails?: string[];

  @ApiProperty({
    example: ['uuid-empleado-1', 'uuid-empleado-2'],
    description: 'IDs de empleados específicos (solo si recipientType es "employees")',
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientEmployeeIds?: string[];

  @ApiProperty({
    example: 'custom_notification',
    description: 'Tipo de notificación',
    required: false,
    default: 'custom_notification'
  })
  @IsOptional()
  @IsString()
  type?: string;
}
