import {
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator';

@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(date: string | Date) {
    if (!date) return false;

    const inputDate = new Date(date);
    const now = new Date();

    // Agregar un margen de 1 minuto para evitar problemas de timing
    const oneMinuteFromNow = new Date(now.getTime() + 60000);

    return inputDate > oneMinuteFromNow;
  }

  defaultMessage() {
    return 'La fecha debe ser futura (mínimo 1 minuto desde ahora)';
  }
}
