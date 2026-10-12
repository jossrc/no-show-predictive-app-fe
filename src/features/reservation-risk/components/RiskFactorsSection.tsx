import { SectionCard } from '@/components/shared/SectionCard';
import type { ModelCatalog } from '@/features/prediction-models/api/contract';
import {
  isKnownModelKey,
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
  if (risk.ok && risk.data.status !== 'AVAILABLE_EXPLORATORY') {
    return (
      <SectionCard title={TITLE}>
        <p className="-mt-1 text-[13px] text-muted-foreground">
          Los factores de esta estimación no están disponibles.
        </p>
      </SectionCard>
    );
  }

  const models = catalog.ok ? catalog.data : null;
  const modelKeys = risk.ok
    ? risk.data.models.map((model) => model.modelKey).filter(isKnownModelKey)
    : selectableModelKeys(models);
  const options = modelKeys.map((modelKey) => ({
    modelKey,
    label: resolveModelIdentity(modelKey, models).label,
  }));

  return (
    <SectionCard
      title={TITLE}
      description="Selecciona un modelo y pulsa Ver factores para consultar su explicación SHAP."
    >
      <RiskFactorsPanel reservationId={reservationId} modelOptions={options} />
    </SectionCard>
  );
}
