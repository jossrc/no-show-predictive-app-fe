import { isDecimalId } from '@/lib/api/schemas';

/** Ruta de un recurso de reserva. El identificador debe validarse antes (cadena decimal). */
export function reservationPath(reservationId: string, suffix = ''): string {
  if (!isDecimalId(reservationId)) throw new RangeError('Identificador de reserva no válido');
  return `/api/v1/reservations/${reservationId}${suffix}`;
}
