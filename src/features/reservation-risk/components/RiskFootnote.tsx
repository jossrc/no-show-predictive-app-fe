import { ChevronRight, Info } from 'lucide-react';

import {
  ESTIMATES_ABOUT_NOTES,
  EXPERIMENTAL_NOTE,
} from '@/features/reservation-risk/model/availability';
import { cn } from '@/lib/utils';

/**
 * Aclaración breve junto a las estimaciones. Se muestra una sola vez por pantalla.
 */
export function RiskFootnote({ className }: { className?: string }) {
  return (
    <p className={cn('flex gap-2 text-xs leading-relaxed text-muted-foreground', className)}>
      <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span>{EXPERIMENTAL_NOTE}</span>
    </p>
  );
}

/** Detalles metodológicos opcionales, cerrados de inicio. */
export function AboutEstimates() {
  return (
    <details className="group text-[13px]">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-sm font-medium text-foreground/80 hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-4 transition-transform group-open:rotate-90"
        />
        Acerca de las estimaciones
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-9 text-muted-foreground">
        {ESTIMATES_ABOUT_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </details>
  );
}
