'use client';

import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { MODEL_KEYS } from '@/features/prediction-models/api/contract';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import { fieldA11y, FilterField } from '@/features/reservations/components/FilterField';
import {
  RELATIVE_BAND_OPTION_LABELS,
  SORT_FIELD_LABELS,
  STATUS_FILTER_LABELS,
} from '@/features/reservations/model/labels';
import {
  EXPERIMENTAL_RISK_LEVELS,
  LISTABLE_STATUSES,
  SORT_FIELDS,
} from '@/features/reservations/model/list-query';
import type { FiltersFormValues } from '@/features/reservations/validation/filters-schema';
import { cn } from '@/lib/utils';

interface FieldsProps {
  register: UseFormRegister<FiltersFormValues>;
  errors: FieldErrors<FiltersFormValues>;
}

/** Filtros principales. La sede se filtra por número: no existe catálogo de nombres. */
export function PeriodFields({ register, errors }: FieldsProps) {
  return (
    <>
      <FilterField id="filter-from" label="Desde" error={errors.from?.message}>
        <Input
          type="date"
          {...fieldA11y('filter-from', errors.from?.message)}
          {...register('from')}
        />
      </FilterField>
      <FilterField id="filter-to" label="Hasta" error={errors.to?.message}>
        <Input type="date" {...fieldA11y('filter-to', errors.to?.message)} {...register('to')} />
      </FilterField>
      <FilterField id="filter-status" label="Estado">
        <NativeSelect id="filter-status" className="w-full" {...register('status')}>
          {LISTABLE_STATUSES.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {STATUS_FILTER_LABELS[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FilterField>
      <FilterField id="filter-clinic" label="Sede" error={errors.clinicId?.message}>
        <Input
          inputMode="numeric"
          placeholder="Todas las sedes"
          autoComplete="off"
          {...fieldA11y('filter-clinic', errors.clinicId?.message)}
          {...register('clinicId')}
        />
      </FilterField>
    </>
  );
}

/** Orden y bandas de investigación del modelo elegido, sin clasificación operativa. */
export function OrderFields({ register }: Pick<FieldsProps, 'register'>) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <FilterField id="filter-sort" label="Ordenar por">
          <NativeSelect id="filter-sort" className="w-full" {...register('sort')}>
            {SORT_FIELDS.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {SORT_FIELD_LABELS[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField id="filter-direction" label="Dirección">
          <NativeSelect id="filter-direction" className="w-full" {...register('direction')}>
            <NativeSelectOption value="asc">Ascendente</NativeSelectOption>
            <NativeSelectOption value="desc">Descendente</NativeSelectOption>
          </NativeSelect>
        </FilterField>
        <FilterField id="filter-model" label="Modelo">
          <NativeSelect id="filter-model" className="w-full" {...register('modelKey')}>
            {MODEL_KEYS.map((key) => (
              <NativeSelectOption key={key} value={key}>
                {resolveModelIdentity(key).label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField id="filter-experimental-level" label="Banda relativa">
          <NativeSelect
            id="filter-experimental-level"
            className="w-full"
            {...register('experimentalRiskLevel')}
          >
            <NativeSelectOption value="">Todas las bandas</NativeSelectOption>
            {EXPERIMENTAL_RISK_LEVELS.map((level) => (
              <NativeSelectOption key={level} value={level}>
                {RELATIVE_BAND_OPTION_LABELS[level]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FilterField>
      </div>
    </>
  );
}

export function PageSizeField({
  register,
  pageSizes,
}: Pick<FieldsProps, 'register'> & { pageSizes: number[] }) {
  return (
    <FilterField id="filter-limit" label="Por página">
      <NativeSelect id="filter-limit" className="w-full" {...register('limit')}>
        {pageSizes.map((size) => (
          <NativeSelectOption key={size} value={String(size)}>
            {size}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </FilterField>
  );
}

/** Botón «Más filtros»: indica cuántos filtros secundarios están activos aunque esté cerrado. */
export function MoreFiltersToggle(props: {
  open: boolean;
  activeCount: number;
  controls: string;
  onToggle: () => void;
}) {
  const { open, activeCount, controls, onToggle } = props;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className="-ml-2"
    >
      <SlidersHorizontal aria-hidden="true" />
      Más filtros
      {activeCount > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-foreground tabular-nums">
          {activeCount}
          <span className="sr-only"> {activeCount === 1 ? 'activo' : 'activos'}</span>
        </span>
      )}
      <ChevronDown
        aria-hidden="true"
        className={cn('transition-transform', open && 'rotate-180')}
      />
    </Button>
  );
}
