import { CalendarCheck2 } from 'lucide-react';

import type { OverbookingSummary } from '@/features/operational-optimization/api/summary.contract';
import { overbookingMark } from '@/features/operational-optimization/model/overbooking-view';
import { cn } from '@/lib/utils';

interface Props {
  summary: OverbookingSummary | null;
  /** En el listado de reservas solo se muestra la marca existente (sin «No habilitado»). */
  onlyWhenEnabled?: boolean;
  className?: string;
}

/**
 * Estado de la marca HU-06. El texto comunica el estado; el color es secundario. `null` indica
 * que el almacén no respondió y nunca se presenta como «No habilitado».
 */
export function OverbookingMarkBadge({ summary, onlyWhenEnabled = false, className }: Props) {
  const { mark, label } = overbookingMark(summary);
  if (onlyWhenEnabled && mark !== 'enabled') return null;
  if (mark !== 'enabled') {
    return (
      <span className={cn('text-[13px] whitespace-nowrap text-muted-foreground', className)}>
        {label}
      </span>
    );
  }
  return <EnabledMark label={label} className={className} />;
}

/** Píldora de la marca registrada «Habilitado para sobreasignación». */
export function EnabledMark({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-fit items-center gap-1.5 rounded-full border border-transparent bg-accent px-2.5 text-xs font-medium whitespace-nowrap text-accent-foreground',
        className,
      )}
    >
      <CalendarCheck2 aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
}
