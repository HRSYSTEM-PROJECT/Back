import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
  IsUrl,
  Matches
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegisterDto {
  @ApiProperty({
    description: 'El nombre comercial es opcional.',
    example: 'HR System'
  })
  @IsString()
  @MaxLength(50)
  trade_name: string;

  @ApiProperty({
    description: 'El nombre legal es único y obligatorio.',
    example: 'HR System SA DE CV'
  })
  @IsNotEmpty()
  @MaxLength(50)
  legal_name: string;

  @ApiProperty({
    description:
      'El email es único, obligatorio y debe estar en formato de email valido.',
    example: 'admin@apibackend.com'
  })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(50)
  email: string;

  @ApiProperty({
    description:
      'La contraseña debe tener al menos 12 caracteres y máximo 25, debe poseer al menos una minúscula, una mayúscula y un número.',
    example: 'Contrasena123'
  })
  @IsString()
  @Length(12, 25)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/, {
    message:
      'La contraseña debe tener al menos 12 caracteres y máximo 25, debe poseer al menos una minúscula, una mayúscula y un número.'
  })
  password: string;

  /*
  @ApiProperty({
    description: 'El ID del plan es obligatorio.',
    example: '3c6a2d6e-e92b-43ef-837c-451b91cb5f33'
  })
  @IsNotEmpty()
  @IsString()
  plan_id: string;
*/

  @ApiProperty({
    description: 'La url y debe estar en formato de url.',
    example: 'https://www.shutterstock.com/es/search/image-not-found-icon'
  })
  @IsString()
  @IsUrl()
  @MaxLength(255)
  logo_url: string | null;

  @ApiProperty({
    description: 'El número telefónico es texto.',
    example: '+10 9999999999'
  })
  @IsString()
  @MaxLength(25)
  phone_number: string;

  @ApiProperty({
    description:
      'La dirección es opcional, no debe ser mayor a 255 caracteres.',
    example: 'Calle Heaven N°444 x Calle Hell'
  })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiProperty({
    description: 'El nombre es opcional, no debe ser mayor a 50 caracteres.',
    example: 'Pepe'
  })
  @IsString()
  @MaxLength(50)
  name: string;
}
