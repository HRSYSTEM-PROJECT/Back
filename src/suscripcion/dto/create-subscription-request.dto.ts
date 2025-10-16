import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateSubscriptionRequestDto {
  @ApiProperty({
    example: 'uuid-del-plan',
    description: 'ID del plan a suscribir'
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  plan_id: string;
}
