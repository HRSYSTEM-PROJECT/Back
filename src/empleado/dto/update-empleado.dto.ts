// import { ApiPropertyOptional } from '@nestjs/swagger';
// import {
//   IsString,
//   IsOptional,
//   IsInt,
//   IsDateString,
//   IsNumber,
//   IsEmail,
//   IsUUID,
//   MaxLength,
//   IsUrl,
//   Matches
// } from 'class-validator';
// import { MaxTwoDecimals } from 'src/validators/max-two-decimals.validator';

// export class UpdateEmployeeDto {
//   @ApiPropertyOptional({
//     example: 'Juan Carlos',
//     description: 'Nombre del empleado (opcional)',
//     maxLength: 50
//   })
//   @IsOptional()
//   @IsString()
//   @MaxLength(50)
//   first_name?: string;

//   @ApiPropertyOptional({
//     example: 'Pérez García',
//     description: 'Apellido del empleado (opcional)',
//     maxLength: 50
//   })
//   @IsOptional()
//   @IsString()
//   @MaxLength(50)
//   last_name?: string;

//   @ApiPropertyOptional({
//     example: 12345680,
//     description: 'DNI único del empleado (opcional)'
//   })
//   @IsOptional()
//   @IsInt()
//   dni?: number;

//   @ApiPropertyOptional({
//     example: '20-12345679-0',
//     description: 'CUIL único del empleado (opcional, formato: XX-XXXXXXXX-X)',
//     maxLength: 13
//   })
//   @IsOptional()
//   @IsString()
//   @MaxLength(13)
//   @Matches(/^\d{2}-\d{8}-\d{1}$/, {
//     message: 'El CUIL debe tener el formato XX-XXXXXXXX-X'
//   })
//   cuil?: string;

//   @ApiPropertyOptional({
//     example: '+54 9 11 9876-5432',
//     description: 'Número de teléfono del empleado (opcional)',
//     maxLength: 20
//   })
//   @IsOptional()
//   @IsString()
//   @MaxLength(20)
//   @Matches(/^\+?[\d\s\-\(\)]+$/, {
//     message: 'El teléfono debe contener solo números, espacios, guiones y paréntesis'
//   })
//   phone_number?: string;

//   @ApiPropertyOptional({
//     example: 'Av. Siempre Viva 456, CABA, Argentina',
//     description: 'Dirección completa del empleado (opcional)',
//     maxLength: 255
//   })
//   @IsOptional()
//   @IsString()
//   @MaxLength(255)
//   address?: string;

//   @ApiPropertyOptional({
//     example: '1990-03-15',
//     description: 'Fecha de nacimiento del empleado (opcional)',
//     format: 'date'
//   })
//   @IsOptional()
//   @IsDateString()
//   birthdate?: Date;

//   @ApiPropertyOptional({
//     example: 'https://cdn.com/new-empleado.png',
//     description: 'URL de la imagen del empleado (opcional)',
//     format: 'url',
//     maxLength: 255
//   })
//   @IsOptional()
//   @IsString()
//   @IsUrl()
//   @MaxLength(255)
//   imgUrl?: string;

//   @ApiPropertyOptional({
//     example: 85000.75,
//     description: 'Sueldo del empleado (opcional)',
//     type: 'number',
//     format: 'float'
//   })
//   @IsOptional()
//   @IsNumber()
//   @MaxTwoDecimals({ message: 'El sueldo debe tener como máximo dos decimales' })
//   salary?: number;

//   @ApiPropertyOptional({
//     example: 'juan.perez.actualizado@email.com',
//     description: 'Correo electrónico del empleado (opcional)',
//     format: 'email',
//     maxLength: 100
//   })
//   @IsOptional()
//   @IsEmail()
//   @MaxLength(100)
//   email?: string;

//   @ApiPropertyOptional({
//     example: '8f3c9d91-8e8e-4e24-a26e-9a7db58b6b91',
//     description: 'ID del departamento al que pertenece el empleado (opcional)',
//     format: 'uuid'
//   })
//   @IsOptional()
//   @IsString()
//   @IsUUID()
//   department_id?: string;

//   @ApiPropertyOptional({
//     example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
//     description: 'ID del puesto/cargo del empleado (opcional)',
//     format: 'uuid'
//   })
//   @IsOptional()
//   @IsString()
//   @IsUUID()
//   position_id?: string;

//   @ApiPropertyOptional({
//     example: '123e4567-e89b-12d3-a456-426614174000',
//     description: 'ID de la empresa a la que pertenece el empleado (opcional)',
//     format: 'uuid'
//   })
//   @IsOptional()
//   @IsString()
//   @IsUUID()
//   company_id?: string;
// }

//refactor para form-data
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  IsNumber,
  IsEmail,
  IsUUID,
  MaxLength,
  IsUrl,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaxTwoDecimals } from 'src/validators/max-two-decimals.validator';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({
    example: 'Juan Carlos',
    description: 'Nombre del empleado (opcional)',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Pérez García',
    description: 'Apellido del empleado (opcional)',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  last_name?: string;

  @ApiPropertyOptional({
    example: 12345680,
    description: 'DNI único del empleado (opcional)',
  })
  @IsOptional()
  @Type(() => Number) // 👈 transforma el string recibido en número
  @IsInt()
  dni?: number;

  @ApiPropertyOptional({
    example: '20-12345679-0',
    description: 'CUIL único del empleado (opcional, formato: XX-XXXXXXXX-X)',
    maxLength: 13,
  })
  @IsOptional()
  @IsString()
  @MaxLength(13)
  @Matches(/^\d{2}-\d{8}-\d{1}$/, {
    message: 'El CUIL debe tener el formato XX-XXXXXXXX-X',
  })
  cuil?: string;

  @ApiPropertyOptional({
    example: '+54 9 11 9876-5432',
    description: 'Número de teléfono del empleado (opcional)',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s\-\(\)]+$/, {
    message:
      'El teléfono debe contener solo números, espacios, guiones y paréntesis',
  })
  phone_number?: string;

  @ApiPropertyOptional({
    example: 'Av. Siempre Viva 456, CABA, Argentina',
    description: 'Dirección completa del empleado (opcional)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    example: '1990-03-15',
    description: 'Fecha de nacimiento del empleado (opcional)',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  birthdate?: Date;

  @ApiPropertyOptional({
    example: 'https://cdn.com/new-empleado.png',
    description: 'URL de la imagen del empleado (opcional)',
    format: 'url',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(255)
  imgUrl?: string;

  @ApiPropertyOptional({
    example: 85000.75,
    description: 'Sueldo del empleado (opcional)',
    type: 'number',
    format: 'float',
  })
  @IsOptional()
  @Type(() => Number) // 👈 transforma el string recibido en número
  @IsNumber()
  @MaxTwoDecimals({ message: 'El sueldo debe tener como máximo dos decimales' })
  salary?: number;

  @ApiPropertyOptional({
    example: 'juan.perez.actualizado@email.com',
    description: 'Correo electrónico del empleado (opcional)',
    format: 'email',
    maxLength: 100,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({
    example: '8f3c9d91-8e8e-4e24-a26e-9a7db58b6b91',
    description: 'ID del departamento al que pertenece el empleado (opcional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID del puesto/cargo del empleado (opcional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  position_id?: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la empresa a la que pertenece el empleado (opcional)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  company_id?: string;
}
