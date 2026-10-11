'use client';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { MODEL_KEYS } from '@/features/prediction-models/api/contract';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import { fieldA11y, FilterField } from '@/features/reservations/components/FilterField';
import { SORT_FIELD_LABELS, STATUS_FILTER_LABELS } from '@/features/reservations/model/labels';
import { LISTABLE_STATUSES, SORT_FIELDS } from '@/features/reservations/model/list-query';
import type { FiltersFormValues } from '@/features/reservations/validation/filters-schema';

interface FieldsProps {
  register: UseFormRegister<FiltersFormValues>;
  errors: FieldErrors<FiltersFormValues>;
}

/** Período, estado y clínica. La clínica se filtra por ID: no existe catálogo de nombres. */
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
      <FilterField id="filter-clinic" label="Clínica (ID)" error={errors.clinicId?.message}>
        <Input
          inputMode="numeric"
          placeholder="Todas"
          autoComplete="off"
          {...fieldA11y('filter-clinic', errors.clinicId?.message)}
          {...register('clinicId')}
        />
      </FilterField>
    </>
  );
}

/** Orden, modelo y tamaño de página. No existe opción de orden por nivel de riesgo. */
export function OrderFields({
  register,
  pageSizes,
}: Pick<FieldsProps, 'register'> & { pageSizes: number[] }) {
  return (
    <>
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
      <FilterField id="filter-limit" label="Por página">
        <NativeSelect id="filter-limit" className="w-full" {...register('limit')}>
          {pageSizes.map((size) => (
            <NativeSelectOption key={size} value={String(size)}>
              {size}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FilterField>
    </>
  );
}
