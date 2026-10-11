'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useId, useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  MoreFiltersToggle,
  OrderFields,
  PeriodFields,
} from '@/features/reservations/components/ReservationFilterFields';
import {
  countAdvancedFilters,
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
 * Filtros del listado (HU-03): fechas, estado y sede a la vista; orden, modelo y tamaño en
 * «Más filtros». Al aplicar se navega a una URL canónica nueva: el cursor se descarta y nunca
 * se envían `riskLevel` ni `sort=riskLevel`.
 */
export function ReservationFilters({ initial }: { initial: ReservationListFilters }) {
  const router = useRouter();
  const panelId = useId();
  const [pending, startTransition] = useTransition();
  const [moreOpen, setMoreOpen] = useState(false);
  const form = useForm<FiltersFormValues, unknown, FiltersFormOutput>({
    resolver: zodResolver(filtersFormSchema),
    defaultValues: toFormValues(initial),
  });
  const [sort, direction, modelKey, limit] = useWatch({
    control: form.control,
    name: ['sort', 'direction', 'modelKey', 'limit'],
  });

  const navigate = (href: string) => startTransition(() => router.push(href));
  const onSubmit = form.handleSubmit((values) => navigate(buildListHref(toFilters(values))));

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Filtros de reservas"
      aria-busy={pending}
      className="mb-5 rounded-xl border bg-card p-4 shadow-surface sm:p-5"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-start">
        <PeriodFields register={form.register} errors={form.formState.errors} />
        <div className="col-span-2 flex lg:col-span-1 lg:pt-[19px]">
          <Button type="submit" disabled={pending} className="w-full lg:w-auto">
            {pending ? 'Aplicando…' : 'Aplicar filtros'}
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <MoreFiltersToggle
          open={moreOpen}
          activeCount={countAdvancedFilters({ sort, direction, modelKey, limit })}
          controls={panelId}
          onToggle={() => setMoreOpen((open) => !open)}
        />
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-muted-foreground md:block">
            Horario de Lima · rango máximo de {MAX_PERIOD_DAYS} días
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => navigate(RESERVATIONS_PATH)}
            className="-mr-2"
          >
            Restablecer
          </Button>
        </div>
      </div>
      <div id={panelId} hidden={!moreOpen} className="mt-3 border-t pt-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <OrderFields register={form.register} pageSizes={pageSizeOptions(initial.limit)} />
        </div>
        {sort === 'probabilityNoShow' && (
          <p className="mt-3 text-xs text-muted-foreground">
            El orden por estimación es experimental: no es una priorización validada.
          </p>
        )}
      </div>
    </form>
  );
}
