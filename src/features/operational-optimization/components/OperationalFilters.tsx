'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { type FieldErrors, useForm, type UseFormRegister } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type {
  OperationalFilters as Filters,
  TrackingView,
} from '@/features/operational-optimization/model/query';
import { buildOperationalHref } from '@/features/operational-optimization/model/urls';
import {
  type OperationalFiltersForm,
  operationalFiltersSchema,
  toOperationalFilters,
  toOperationalFormValues,
} from '@/features/operational-optimization/validation/filters-schema';
import { MODEL_KEYS } from '@/features/prediction-models/api/contract';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import { fieldA11y, FilterField } from '@/features/reservations/components/FilterField';
import { STATUS_FILTER_LABELS } from '@/features/reservations/model/labels';
import { LISTABLE_STATUSES, MAX_PERIOD_DAYS } from '@/features/reservations/model/list-query';
import { OPERATIONAL_PATH } from '@/lib/routes';

type FormOutput = ReturnType<typeof operationalFiltersSchema.parse>;

/**
 * Filtros de la Figura 17 (Fecha desde, Fecha hasta, Sede, Estado) más el modelo que define la
 * banda Alta. Al aplicar se navega a una URL canónica: los cursores se descartan.
 */
export function OperationalFilters({ initial, view }: { initial: Filters; view: TrackingView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<OperationalFiltersForm, unknown, FormOutput>({
    resolver: zodResolver(operationalFiltersSchema),
    defaultValues: toOperationalFormValues(initial),
  });
  const navigate = (href: string) => startTransition(() => router.push(href));
  const onSubmit = form.handleSubmit((values) =>
    navigate(buildOperationalHref(toOperationalFilters(values), { view })),
  );

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Filtros de búsqueda"
      aria-busy={pending}
      className="mb-5 rounded-xl border bg-card p-4 shadow-surface sm:p-5"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-start">
        <OperationalFilterFields register={form.register} errors={form.formState.errors} />
        <div className="col-span-2 flex lg:col-span-1 lg:pt-[19px]">
          <Button type="submit" disabled={pending} className="w-full lg:w-auto">
            {pending ? 'Aplicando…' : 'Aplicar filtros'}
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Fechas de la cita en horario de Lima · rango máximo de {MAX_PERIOD_DAYS} días. Estado y
          modelo aplican a «Reservas con alto riesgo».
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => navigate(OPERATIONAL_PATH)}
          className="-mr-2"
        >
          Restablecer
        </Button>
      </div>
    </form>
  );
}

function OperationalFilterFields({
  register,
  errors,
}: {
  register: UseFormRegister<OperationalFiltersForm>;
  errors: FieldErrors<OperationalFiltersForm>;
}) {
  return (
    <>
      <FilterField id="op-from" label="Fecha desde" error={errors.from?.message}>
        <Input type="date" {...fieldA11y('op-from', errors.from?.message)} {...register('from')} />
      </FilterField>
      <FilterField id="op-to" label="Fecha hasta" error={errors.to?.message}>
        <Input type="date" {...fieldA11y('op-to', errors.to?.message)} {...register('to')} />
      </FilterField>
      <FilterField id="op-clinic" label="Sede" error={errors.clinicId?.message}>
        <Input
          inputMode="numeric"
          placeholder="Todas las sedes"
          autoComplete="off"
          {...fieldA11y('op-clinic', errors.clinicId?.message)}
          {...register('clinicId')}
        />
      </FilterField>
      <FilterField id="op-status" label="Estado de la reserva">
        <NativeSelect id="op-status" className="w-full" {...register('status')}>
          {LISTABLE_STATUSES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {STATUS_FILTER_LABELS[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FilterField>
      <FilterField id="op-model" label="Modelo">
        <NativeSelect id="op-model" className="w-full" {...register('modelKey')}>
          {MODEL_KEYS.map((key) => (
            <NativeSelectOption key={key} value={key}>
              {resolveModelIdentity(key).label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FilterField>
    </>
  );
}
