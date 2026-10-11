import { Info } from 'lucide-react';

import {
  EXPERIMENTAL_NOTE,
  EXPERIMENTAL_NOTE_PLURAL,
} from '@/features/reservation-risk/model/availability';
import { cn } from '@/lib/utils';

/**
 * Advertencia científica junto a las estimaciones: preserva su significado (experimentales, no
 * aptas para decisiones operativas) sin repetirla en varios lugares.
 */
export function RiskFootnote({
  plural = false,
  detail,
  className,
}: {
  plural?: boolean;
  /** Aclaración adicional opcional, p. ej. la clasificación de riesgo pendiente. */
  detail?: string | null;
  className?: string;
}) {
  return (
    <p className={cn('flex gap-2 text-xs leading-relaxed text-muted-foreground', className)}>
      <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span>
        {plural ? EXPERIMENTAL_NOTE_PLURAL : EXPERIMENTAL_NOTE}
        {detail && <> {detail}</>}
      </span>
    </p>
  );
}
