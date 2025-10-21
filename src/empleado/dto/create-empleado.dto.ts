// import { ApiProperty } from '@nestjs/swagger';
// import {
//   IsString,
//   IsNotEmpty,
//   IsInt,
//   IsOptional,
//   IsDateString,
//   IsNumber,
//   IsEmail,
//   IsUUID,
//   MaxLength,
//   IsUrl,
//   Matches
// } from 'class-validator';
// import { MaxTwoDecimals } from 'src/validators/max-two-decimals.validator';

// export class CreateEmployeeDto {
//   @ApiProperty({
//     example: 'Juan',
//     description: 'Nombre del empleado',
//     maxLength: 50
//   })
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(50)
//   first_name: string;

//   @ApiProperty({
//     example: 'Pérez',
//     description: 'Apellido del empleado',
//     maxLength: 50
//   })
//   @IsString()
//   @IsNotEmpty()
//   @MaxLength(50)
//   last_name: string;

//   @ApiProperty({ example: 12345679, description: 'DNI único del empleado' })
//   @IsInt()
//   @IsOptional()
//   dni: number;

//   @ApiProperty({
//     example: '20-12345678-9',
//     description: 'CUIL único del empleado (formato: XX-XXXXXXXX-X)',
//     maxLength: 13
//   })
//   @IsString()
//   @IsOptional()
//   @MaxLength(13)
//   @Matches(/^\d{2}-\d{8}-\d{1}$/, {
//     message: 'El CUIL debe tener el formato XX-XXXXXXXX-X'
//   })
//   cuil: string;

//   @ApiProperty({
//     example: '+54 9 11 1234-5678',
//     description: 'Número de teléfono del empleado',
//     maxLength: 20,
//     required: false
//   })
//   @IsOptional()
//   @IsString()
//   @MaxLength(20)
//   @Matches(/^\+?[\d\s\-\(\)]+$/, {
//     message:
//       'El teléfono debe contener solo números, espacios, guiones y paréntesis'
//   })
//   phone_number: string;

//   @ApiProperty({
//     example: 'Av. Siempre Viva 123, CABA, Argentina',
//     description: 'Dirección completa del empleado',
//     maxLength: 255,
//     required: false
//   })
//   @IsOptional()
//   @IsString()
//   @MaxLength(255)
//   address?: string;

//   @ApiProperty({
//     example: '1995-05-12',
//     description:
//       'Fecha de nacimiento (si se completa este campo, se calcula y se envia la edad de forma dinámica)',
//     required: false
//   })
//   @IsOptional()
//   @IsDateString()
//   birthdate?: Date;

//   @ApiProperty({
//     example: 'https://cdn.com/empleado.png',
//     description: 'URL de la imagen del empleado',
//     format: 'url',
//     maxLength: 255,
//     required: false
//   })
//   @IsOptional()
//   @IsString()
//   @IsUrl()
//   @MaxLength(255)
//   imgUrl: string;

//   @ApiProperty({
//     example: 75000.5,
//     description: 'Sueldo del empleado',
//     required: false,
//     type: 'number',
//     format: 'float'
//   })
//   @IsOptional()
//   @IsNumber()
//   @MaxTwoDecimals({ message: 'El sueldo debe tener como máximo dos decimales' })
//   salary: number;

//   @ApiProperty({
//     example: 'juan.perez@email.com',
//     description: 'Correo electrónico del empleado',
//     format: 'email',
//     maxLength: 100
//   })
//   @IsEmail()
//   @IsOptional()
//   @MaxLength(100)
//   email: string;

//   // 🚀 Nuevos campos opcionales para relaciones
//   @ApiProperty({
//     example: '8f3c9d91-8e8e-4e24-a26e-9a7db58b6b91',
//     description: 'ID del departamento al que pertenece el empleado',
//     required: false
//   })
//   @IsOptional()
//   @IsUUID()
//   department_id?: string;

//   @ApiProperty({
//     example: '7c2f8d81-2a1c-4c14-a18d-5a9dc48a6b22',
//     description: 'ID de la posición/cargo del empleado',
//     required: false
//   })
//   @IsOptional()
//   @IsUUID()
//   position_id?: string;
// }

//refactor para form-data
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEmail,
  IsUUID,
  MaxLength,
  IsUrl,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer'; // 👈 agregado para transformar tipos
import { MaxTwoDecimals } from 'src/validators/max-two-decimals.validator';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del empleado',
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  first_name: string;

  @ApiProperty({
    example: 'Pérez',
    description: 'Apellido del empleado',
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  last_name: string;

  @ApiProperty({ example: 12345679, description: 'DNI único del empleado' })
  @IsOptional()
  @Type(() => Number) // 👈 transforma "12345679" (string) en 12345679 (number)
  @IsInt()
  dni: number;

  @ApiProperty({
    example: '20-12345678-9',
    description: 'CUIL único del empleado (formato: XX-XXXXXXXX-X)',
    maxLength: 13
  })
  @IsString()
  @IsOptional()
  @MaxLength(13)
  @Matches(/^\d{2}-\d{8}-\d{1}$/, {
    message: 'El CUIL debe tener el formato XX-XXXXXXXX-X'
  })
  cuil: string;

  @ApiProperty({
    example: '+54 9 11 1234-5678',
    description: 'Número de teléfono del empleado',
    maxLength: 20,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s\-\(\)]+$/, {
    message:
      'El teléfono debe contener solo números, espacios, guiones y paréntesis'
  })
  phone_number: string;

  @ApiProperty({
    example: 'Av. Siempre Viva 123, CABA, Argentina',
    description: 'Dirección completa del empleado',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty({
    example: '1995-05-12',
    description:
      'Fecha de nacimiento (si se completa este campo, se calcula y se envia la edad de forma dinámica)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  birthdate?: Date;

  @ApiProperty({
    example: 'https://cdn.com/empleado.png',
    description: 'URL de la imagen del empleado',
    format: 'url',
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(255)
  imgUrl: string;

  @ApiProperty({
    example: 75000.5,
    description: 'Sueldo del empleado',
    required: false,
    type: 'number',
    format: 'float'
  })
  @IsOptional()
  @Type(() => Number) // 👈 transforma "75000.5" (string) en 75000.5 (number)
  @IsNumber()
  @MaxTwoDecimals({ message: 'El sueldo debe tener como máximo dos decimales' })
  salary: number;

  @ApiProperty({
    example: 'juan.perez@email.com',
    description: 'Correo electrónico del empleado',
    format: 'email',
    maxLength: 100
  })
  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email: string;

  // 🚀 Nuevos campos opcionales para relaciones
  @ApiProperty({
    example: '8f3c9d91-8e8e-4e24-a26e-9a7db58b6b91',
    description: 'ID del departamento al que pertenece el empleado',
    required: false
  })
  @IsOptional()
  @IsUUID()
  department_id?: string;

  @ApiProperty({
    example: '7c2f8d81-2a1c-4c14-a18d-5a9dc48a6b22',
    description: 'ID de la posición/cargo del empleado',
    required: false
  })
  @IsOptional()
  @IsUUID()
  position_id?: string;
}
