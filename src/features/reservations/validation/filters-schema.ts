import { z } from 'zod';

import { MODEL_KEYS } from '@/features/prediction-models/api/contract';
import {
  isValidClinicId,
  LISTABLE_STATUSES,
  PAGE_SIZES,
  type ReservationListFilters,
  SORT_DIRECTIONS,
  SORT_FIELDS,
  validatePeriod,
} from '@/features/reservations/model/list-query';
import { isCalendarDate } from '@/lib/dates/calendar';

/**
 * Validación del formulario de filtros (HU-03). Replica las reglas del contrato para dar
 * mensajes inmediatos; el backend sigue siendo la autoridad (422 INVALID_PERIOD…).
 */
export const filtersFormSchema = z
  .object({
    from: z.string().refine(isCalendarDate, 'Ingresa una fecha inicial válida.'),
    to: z.string().refine(isCalendarDate, 'Ingresa una fecha final válida.'),
    status: z.enum(LISTABLE_STATUSES),
    clinicId: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || isValidClinicId(value),
        'Usa un identificador numérico de clínica (por ejemplo, 11).',
      ),
    sort: z.enum(SORT_FIELDS),
    direction: z.enum(SORT_DIRECTIONS),
    modelKey: z.enum(MODEL_KEYS),
    // 1–100 según contrato; la URL puede traer un tamaño válido fuera de las opciones habituales.
    limit: z
      .string()
      .regex(/^\d{1,3}$/)
      .refine((value) => Number(value) >= 1 && Number(value) <= 100),
  })
  .superRefine((values, context) => {
    if (!isCalendarDate(values.from) || !isCalendarDate(values.to)) return;
    const error = validatePeriod(values.from, values.to);
    if (error) context.addIssue({ code: 'custom', path: ['to'], message: error });
  });

export type FiltersFormValues = z.input<typeof filtersFormSchema>;

export function toFormValues(filters: ReservationListFilters): FiltersFormValues {
  return {
    from: filters.from,
    to: filters.to,
    status: filters.status,
    clinicId: filters.clinicId ?? '',
    sort: filters.sort,
    direction: filters.direction,
    modelKey: filters.modelKey,
    limit: String(filters.limit),
  };
}

export function toFilters(values: z.output<typeof filtersFormSchema>): ReservationListFilters {
  return {
    from: values.from,
    to: values.to,
    status: values.status,
    clinicId: values.clinicId === '' ? null : values.clinicId,
    sort: values.sort,
    direction: values.direction,
    modelKey: values.modelKey,
    limit: Number(values.limit),
  };
}

/** Opciones de tamaño de página, incluido el valor actual si no es uno de los habituales. */
export function pageSizeOptions(current: number): number[] {
  return [...new Set<number>([...PAGE_SIZES, current])].sort((a, b) => a - b);
}
