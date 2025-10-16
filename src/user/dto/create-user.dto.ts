import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
  MaxLength,
  MinLength,
  IsUrl
} from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del empleado asociado (opcional)',
    format: 'uuid'
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  employee_id: string | null;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la empresa asociada (opcional)',
    format: 'uuid'
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  company_id: string | null;

  @ApiProperty({
    example: 'usuario@empresa.com',
    description: 'Correo electrónico del usuario (único)',
    format: 'email'
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @ApiProperty({
    example: 'Contrasena123!',
    description: 'Contraseña del usuario (mínimo 8 caracteres)',
    minLength: 8,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del usuario',
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  first_name: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del usuario',
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  last_name: string;

  @ApiPropertyOptional({
    example: 'https://cdn.com/profile.jpg',
    description: 'URL de la imagen de perfil (opcional)',
    format: 'url'
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(255)
  profile_image_url: string | null;
}
