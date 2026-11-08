import { z } from 'zod';

import type { OperationalFilters } from '@/features/operational-optimization/model/query';
import { MODEL_KEYS } from '@/features/prediction-models/api/contract';
import {
  isValidClinicId,
  LISTABLE_STATUSES,
  validatePeriod,
} from '@/features/reservations/model/list-query';
import { isCalendarDate } from '@/lib/dates/calendar';

/**
 * Filtros de «Optimización operativa». Replican las reglas del contrato para dar mensajes
 * inmediatos (período ≤ 92 días, sede numérica); el backend sigue siendo la autoridad.
 */
export const operationalFiltersSchema = z
  .object({
    from: z.string().refine(isCalendarDate, 'Ingresa una fecha inicial válida.'),
    to: z.string().refine(isCalendarDate, 'Ingresa una fecha final válida.'),
    clinicId: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || isValidClinicId(value),
        'Ingresa el número de sede (por ejemplo, 11).',
      ),
    status: z.enum(LISTABLE_STATUSES),
    modelKey: z.enum(MODEL_KEYS),
  })
  .superRefine((values, context) => {
    if (!isCalendarDate(values.from) || !isCalendarDate(values.to)) return;
    const error = validatePeriod(values.from, values.to);
    if (error) context.addIssue({ code: 'custom', path: ['to'], message: error });
  });

export type OperationalFiltersForm = z.input<typeof operationalFiltersSchema>;

export function toOperationalFormValues(filters: OperationalFilters): OperationalFiltersForm {
  return { ...filters, clinicId: filters.clinicId ?? '' };
}

export function toOperationalFilters(
  values: z.output<typeof operationalFiltersSchema>,
): OperationalFilters {
  return { ...values, clinicId: values.clinicId === '' ? null : values.clinicId };
}
