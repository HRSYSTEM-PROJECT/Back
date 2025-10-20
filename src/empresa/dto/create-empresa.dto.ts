import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  IsUrl,
  Matches
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Tech Solutions',
    description: 'Nombre comercial de la empresa',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  trade_name: string;

  @ApiProperty({
    example: 'Argentina',
    description: 'Pais de residencia de la empresa',
    maxLength: 100
  })
  @IsString()
  //@IsNotEmpty()
   @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    example: 'Tech Solutions S.A.',
    description: 'Razón social única de la empresa',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  legal_name: string;

  @ApiPropertyOptional({
    example: 'Av. Siempre Viva 123, CABA, Argentina',
    description: 'Dirección completa de la empresa',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    example: '+54 11 1234-5678',
    description: 'Número de teléfono de la empresa',
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s\-\(\)]+$/, {
    message:
      'El teléfono debe contener solo números, espacios, guiones y paréntesis'
  })
  phone_number?: string;

  @ApiPropertyOptional({
    example: 'contacto@techsolutions.com',
    description: 'Correo electrónico de la empresa',
    format: 'email',
    maxLength: 100
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.com/logo.png',
    description: 'URL del logo de la empresa',
    format: 'url',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(255)
  logo?: string;
}
