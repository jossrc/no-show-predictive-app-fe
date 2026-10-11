import { SectionCard } from '@/components/shared/SectionCard';
import type { ModelCatalog } from '@/features/prediction-models/api/contract';
import {
  resolveModelIdentity,
  selectableModelKeys,
} from '@/features/prediction-models/model/model-identity';
import type { RiskAssessment } from '@/features/reservation-risk/api/risk.contract';
import { RiskFactorsPanel } from '@/features/reservation-risk/components/RiskFactorsPanel';
import { NON_CAUSAL_NOTE } from '@/features/reservation-risk/model/factors';
import type { ApiResult } from '@/lib/api/result';

interface Props {
  reservationId: string;
  risk: ApiResult<RiskAssessment>;
  catalog: ApiResult<ModelCatalog>;
}

function unavailableReason(risk: ApiResult<RiskAssessment>): string | null {
  if (risk.ok && risk.data.status === 'NOT_SCORABLE') {
    return 'La explicación no está disponible: la reserva no es evaluable con la evidencia temporal actual.';
  }
  return null;
}

/** HU-05: factores asociados (SHAP). Bloque secundario, sin carga automática. */
export function RiskFactorsSection({ reservationId, risk, catalog }: Props) {
  const keys = selectableModelKeys(catalog.ok ? catalog.data : null);
  const options = keys.map((modelKey) => ({
    modelKey,
    label: resolveModelIdentity(modelKey, catalog.ok ? catalog.data : null).label,
  }));

  return (
    <SectionCard
      title="Factores asociados a la estimación"
      description="Explicación local SHAP bajo demanda (HU-05)"
      footer={NON_CAUSAL_NOTE}
    >
      <RiskFactorsPanel
        reservationId={reservationId}
        modelOptions={options}
        unavailableReason={unavailableReason(risk)}
      />
    </SectionCard>
  );
}
