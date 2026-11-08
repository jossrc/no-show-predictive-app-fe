'use client';

import { useId } from 'react';

import { cn } from '@/lib/utils';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface Props<T extends string> {
  legend: string;
  options: ChoiceOption<T>[];
  /** `null`: ninguna opción preseleccionada (la elección debe ser explícita). */
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
}

/**
 * Selección excluyente con radios nativos (`fieldset`/`legend`): navegable con flechas y
 * anunciada por lectores de pantalla. Sin opción preseleccionada.
 */
export function ChoiceGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  disabled = false,
}: Props<T>) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-2">
      <legend className="mb-2 text-[13px] font-medium text-foreground/80">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cn(
                'flex min-w-0 cursor-pointer items-start gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors',
                'has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-60',
                checked ? 'border-primary bg-accent/60' : 'hover:bg-surface-subtle',
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0">
                <span className="block font-medium">{option.label}</span>
                {option.description && (
                  <span className="mt-0.5 block text-xs break-words text-muted-foreground">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
