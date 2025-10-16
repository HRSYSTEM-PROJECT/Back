import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({ example: 'uuid-del-plan', description: 'ID del plan' })
  id: string;

  @ApiProperty({ example: 'Plan Premium', description: 'Nombre del plan' })
  name: string;

  @ApiProperty({ example: 49.99, description: 'Precio del plan' })
  price: number;

  @ApiProperty({ example: 60, description: 'Duración en días' })
  duration_days: number;
}

export class SubscriptionResponseDto {
  @ApiProperty({
    example: 'uuid-de-la-suscripcion',
    description: 'ID de la suscripción'
  })
  id: string;

  @ApiProperty({
    example: 'uuid-de-la-empresa',
    description: 'ID de la empresa'
  })
  empresa_id: string;

  @ApiProperty({ type: PlanResponseDto, description: 'Información del plan' })
  plan: PlanResponseDto;

  @ApiProperty({ example: 'active', description: 'Estado de la suscripción' })
  status: string;

  @ApiProperty({ example: '2025-10-09', description: 'Fecha de inicio' })
  start_date: string;

  @ApiProperty({ example: '2025-11-09', description: 'Fecha de fin' })
  end_date: string;
}
