import { SectionCard } from '@/components/shared/SectionCard';
import type { ModelCatalog } from '@/features/prediction-models/api/contract';
import {
  resolveModelIdentity,
  selectableModelKeys,
} from '@/features/prediction-models/model/model-identity';
import type { RiskAssessment } from '@/features/reservation-risk/api/risk.contract';
import { RiskFactorsPanel } from '@/features/reservation-risk/components/RiskFactorsPanel';
import type { ApiResult } from '@/lib/api/result';

interface Props {
  reservationId: string;
  risk: ApiResult<RiskAssessment>;
  catalog: ApiResult<ModelCatalog>;
}

const TITLE = 'Factores relacionados con la estimación';

/**
 * HU-05: factores asociados (SHAP) en lista, sin gráficos ni carga automática. Sin estimación
 * posible (NOT_SCORABLE) la sección queda compacta y secundaria.
 */
export function RiskFactorsSection({ reservationId, risk, catalog }: Props) {
  if (risk.ok && risk.data.status === 'NOT_SCORABLE') {
    return (
      <SectionCard title={TITLE}>
        <p className="-mt-1 text-[13px] text-muted-foreground">
          Los factores de esta estimación no están disponibles.
        </p>
      </SectionCard>
    );
  }

  const models = catalog.ok ? catalog.data : null;
  const options = selectableModelKeys(models).map((modelKey) => ({
    modelKey,
    label: resolveModelIdentity(modelKey, models).label,
  }));

  return (
    <SectionCard
      title={TITLE}
      description="Consulta qué datos tuvieron más peso en el cálculo de un modelo."
    >
      <RiskFactorsPanel reservationId={reservationId} modelOptions={options} />
    </SectionCard>
  );
}
