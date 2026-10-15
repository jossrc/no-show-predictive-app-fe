import { CalendarClock, CircleSlash } from 'lucide-react';

import { DevelopmentDiagnostics } from '@/components/diagnostics/DevelopmentDiagnostics';
import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { SectionCard } from '@/components/shared/SectionCard';
import type { ModelCatalog } from '@/features/prediction-models/api/contract';
import { isKnownModelKey } from '@/features/prediction-models/model/model-identity';
import type { RiskAssessment } from '@/features/reservation-risk/api/risk.contract';
import {
  type BandThresholdRow,
  BandThresholdsInfo,
} from '@/features/reservation-risk/components/BandThresholdsInfo';
import { ModelScoreCard } from '@/features/reservation-risk/components/ModelScoreCard';
import { RequestPredictionPanel } from '@/features/reservation-risk/components/RequestPredictionPanel';
import { AVAILABILITY_MESSAGES } from '@/features/reservation-risk/model/availability';
import { riskDiagnostics } from '@/features/reservation-risk/model/diagnostics';
import {
  buildModelSlots,
  type ModelSlot,
  predictionRequestAvailability,
} from '@/features/reservation-risk/model/risk-view';
import type { ApiResult } from '@/lib/api/result';
import { formatPercentage } from '@/lib/format/percentage';

interface RiskSectionProps {
  reservationId: string;
  risk: ApiResult<RiskAssessment>;
  catalog: ApiResult<ModelCatalog>;
}

const TITLE = 'Estimación de inasistencia';

function modelOptions(slots: ModelSlot[]) {
  return slots.flatMap((slot) =>
    slot.identity.known && isKnownModelKey(slot.modelKey)
      ? [{ modelKey: slot.modelKey, label: slot.identity.label }]
      : [],
  );
}

/** NOT_SCORED / NOT_SCORABLE: estado funcional compacto, no un error. */
function EstimateState({
  status,
  reasons,
}: Pick<RiskAssessment, 'reasons'> & {
  status: keyof typeof AVAILABILITY_MESSAGES;
}) {
  const { title, text } = AVAILABILITY_MESSAGES[status];
  const Icon = status === 'NOT_SCORABLE' ? CircleSlash : CalendarClock;
  return (
    <div className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">{title}</p>
        {reasons.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4 text-[13px] text-pretty text-muted-foreground">
            {reasons.map((reason, index) => (
              <li key={`${reason.code}-${index}`}>{reason.message}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-pretty text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );
}

function bandThresholdRows(slots: ModelSlot[]): BandThresholdRow[] {
  return slots.flatMap((slot) => {
    const band = slot.result?.experimentalRisk;
    if (!band) return [];
    return [
      {
        label: slot.identity.label,
        lowUpper: formatPercentage(band.lowUpperThreshold * 100),
        highLower: formatPercentage(band.highLowerThreshold * 100),
      },
    ];
  });
}

function Estimates({ slots }: { slots: ModelSlot[] }) {
  return (
    <div className="grid divide-y overflow-hidden rounded-lg border bg-surface-subtle sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      {slots.map((slot) => (
        <ModelScoreCard key={slot.modelKey} slot={slot} />
      ))}
    </div>
  );
}

/** HU-02: resultados por modelo y solicitud explícita. Sin POST automático ni semáforos. */
export function RiskSection({ reservationId, risk, catalog }: RiskSectionProps) {
  const diagnostics = (
    <DevelopmentDiagnostics subject={TITLE} sections={riskDiagnostics(risk, catalog)} />
  );
  if (!risk.ok) {
    return (
      <SectionCard title={TITLE} actions={diagnostics}>
        <ApiErrorNotice
          error={risk.error}
          action={<RefreshButton label="Reintentar" size="sm" />}
        />
      </SectionCard>
    );
  }

  const assessment = risk.data;
  const slots = buildModelSlots(assessment, catalog.ok ? catalog.data : null);

  return (
    <SectionCard
      title={TITLE}
      meta={<BandThresholdsInfo models={bandThresholdRows(slots)} />}
      actions={diagnostics}
    >
      <div className="space-y-4">
        {assessment.status === 'AVAILABLE_EXPLORATORY' ? (
          <Estimates slots={slots} />
        ) : (
          <EstimateState status={assessment.status} reasons={assessment.reasons} />
        )}
        {/* Misma posición en todos los estados: el resultado del cálculo persiste tras refrescar. */}
        <RequestPredictionPanel
          reservationId={reservationId}
          modelOptions={modelOptions(slots)}
          availability={predictionRequestAvailability(assessment, slots)}
        />
      </div>
    </SectionCard>
  );
}
