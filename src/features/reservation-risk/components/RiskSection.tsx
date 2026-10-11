import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { ReasonList } from '@/components/shared/ReasonList';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { SectionCard } from '@/components/shared/SectionCard';
import type { ModelCatalog } from '@/features/prediction-models/api/contract';
import { isKnownModelKey } from '@/features/prediction-models/model/model-identity';
import type { RiskAssessment } from '@/features/reservation-risk/api/risk.contract';
import { AvailabilityBadge } from '@/features/reservation-risk/components/AvailabilityBadge';
import { ModelScoreCard } from '@/features/reservation-risk/components/ModelScoreCard';
import { RequestPredictionPanel } from '@/features/reservation-risk/components/RequestPredictionPanel';
import { RiskFootnote } from '@/features/reservation-risk/components/RiskFootnote';
import { AVAILABILITY_DESCRIPTIONS } from '@/features/reservation-risk/model/availability';
import {
  buildModelSlots,
  type ModelSlot,
  predictionRequestAvailability,
} from '@/features/reservation-risk/model/risk-view';
import type { ApiResult } from '@/lib/api/result';
import { formatPercentagePoints } from '@/lib/format/percentage';

interface RiskSectionProps {
  reservationId: string;
  risk: ApiResult<RiskAssessment>;
  catalog: ApiResult<ModelCatalog>;
}

const TITLE = 'Estimación predictiva';

function modelOptions(slots: ModelSlot[]) {
  return slots.flatMap((slot) =>
    slot.identity.known && isKnownModelKey(slot.modelKey)
      ? [{ modelKey: slot.modelKey, label: slot.identity.label }]
      : [],
  );
}

function Comparison({ risk }: { risk: RiskAssessment }) {
  if (!risk.comparison) return null;
  return (
    <p className="text-xs text-muted-foreground">
      Diferencia absoluta entre modelos:{' '}
      <span className="font-medium text-foreground tabular-nums">
        {formatPercentagePoints(risk.comparison.absolutePercentagePointDifference)}
      </span>
      . Es descriptiva: no indica confianza ni qué modelo es más preciso.
    </p>
  );
}

/** HU-02: estado predictivo, resultados por modelo y solicitud explícita de predicción. */
export function RiskSection({ reservationId, risk, catalog }: RiskSectionProps) {
  if (!risk.ok) {
    return (
      <SectionCard title={TITLE} description="Probabilidad estimada de inasistencia (HU-02)">
        <ApiErrorNotice error={risk.error} action={<RefreshButton label="Reintentar" />} />
      </SectionCard>
    );
  }

  const assessment = risk.data;
  const slots = buildModelSlots(assessment, catalog.ok ? catalog.data : null);
  const hasResults = assessment.status === 'AVAILABLE_EXPLORATORY';

  return (
    <SectionCard
      title={TITLE}
      description="Probabilidad estimada de inasistencia por modelo independiente (HU-02)"
      meta={<AvailabilityBadge availability={assessment.status} />}
      footer={<RiskFootnote risk={assessment} catalog={catalog} />}
    >
      <div className="space-y-4">
        {!hasResults && (
          <div className="space-y-2">
            <p className="text-sm">{AVAILABILITY_DESCRIPTIONS[assessment.status]}</p>
            <ReasonList reasons={assessment.reasons} summary="Ver motivos" />
          </div>
        )}
        {hasResults && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => (
                <ModelScoreCard key={slot.modelKey} slot={slot} />
              ))}
            </div>
            <Comparison risk={assessment} />
          </>
        )}
        <RequestPredictionPanel
          reservationId={reservationId}
          modelOptions={modelOptions(slots)}
          availability={predictionRequestAvailability(assessment, slots)}
        />
      </div>
    </SectionCard>
  );
}
