'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  OrderFields,
  PeriodFields,
} from '@/features/reservations/components/ReservationFilterFields';
import {
  MAX_PERIOD_DAYS,
  type ReservationListFilters,
} from '@/features/reservations/model/list-query';
import { buildListHref, RESERVATIONS_PATH } from '@/features/reservations/model/list-url';
import {
  filtersFormSchema,
  type FiltersFormValues,
  pageSizeOptions,
  toFilters,
  toFormValues,
} from '@/features/reservations/validation/filters-schema';

type FiltersFormOutput = ReturnType<typeof filtersFormSchema.parse>;

/**
 * Filtros y orden del listado (HU-03). Al aplicar se navega a una URL canónica nueva:
 * el cursor se descarta y nunca se envían `riskLevel` ni `sort=riskLevel`.
 */
export function ReservationFilters({ initial }: { initial: ReservationListFilters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<FiltersFormValues, unknown, FiltersFormOutput>({
    resolver: zodResolver(filtersFormSchema),
    defaultValues: toFormValues(initial),
  });
  const sort = useWatch({ control: form.control, name: 'sort' });

  const navigate = (href: string) => startTransition(() => router.push(href));
  const onSubmit = form.handleSubmit((values) => navigate(buildListHref(toFilters(values))));

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Filtros de reservas"
      aria-busy={pending}
      className="mb-4 rounded-xl border bg-card p-4 shadow-xs"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-[repeat(2,minmax(8.5rem,1fr))_minmax(8rem,1fr)_minmax(6rem,0.8fr)_minmax(12rem,1.5fr)_minmax(8rem,1fr)_minmax(9rem,1.1fr)_minmax(5rem,0.6fr)]">
        <PeriodFields register={form.register} errors={form.formState.errors} />
        <OrderFields register={form.register} pageSizes={pageSizeOptions(initial.limit)} />
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {sort === 'probabilityNoShow'
            ? 'Orden exploratorio por probabilidad del modelo elegido; no es una priorización operativa validada.'
            : `Fechas del calendario de Lima, inclusivas. Rango máximo: ${MAX_PERIOD_DAYS} días.`}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => navigate(RESERVATIONS_PATH)}
          >
            Restablecer
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? 'Aplicando…' : 'Aplicar filtros'}
          </Button>
        </div>
      </div>
    </form>
  );
}
