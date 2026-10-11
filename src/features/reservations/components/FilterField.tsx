import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';

interface FilterFieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

/** Etiqueta + control + mensaje de error asociado mediante `aria-describedby`. */
export function FilterField({ id, label, error, children }: FilterFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-foreground/80">
        {label}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function fieldA11y(id: string, error: string | undefined) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  } as const;
}
