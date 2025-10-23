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

    // Agregar un margen de 30 segundos para evitar problemas de timing
    const thirtySecondsFromNow = new Date(now.getTime() + 30000);

    return inputDate > thirtySecondsFromNow;
  }

  defaultMessage() {
    return 'La fecha debe ser futura (mínimo 30 segundos desde ahora)';
  }
}
