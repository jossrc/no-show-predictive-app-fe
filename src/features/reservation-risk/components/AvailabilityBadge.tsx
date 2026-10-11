import { Badge } from '@/components/ui/badge';
import type { PredictionAvailability } from '@/features/reservation-risk/api/risk.contract';
import { AVAILABILITY_LABELS } from '@/features/reservation-risk/model/availability';
import { cn } from '@/lib/utils';

/**
 * Estado predictivo con estilos neutros: distingue disponibilidad, no nivel de riesgo.
 * La diferencia se comunica por texto (no depende solo del color).
 */
const STYLES: Record<PredictionAvailability, string> = {
  AVAILABLE_EXPLORATORY: 'border-transparent bg-accent text-accent-foreground',
  NOT_SCORED: 'border-border bg-transparent text-muted-foreground',
  NOT_SCORABLE: 'border-dashed border-border bg-transparent text-muted-foreground',
};

export function AvailabilityBadge({ availability }: { availability: PredictionAvailability }) {
  return (
    <Badge variant="outline" className={cn('font-normal', STYLES[availability])}>
      {AVAILABILITY_LABELS[availability]}
    </Badge>
  );
}
