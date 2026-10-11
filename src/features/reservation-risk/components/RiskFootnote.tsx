import type { ModelCatalog } from '@/features/prediction-models/api/contract';
import type { RiskAssessment } from '@/features/reservation-risk/api/risk.contract';
import {
  describeSourceStatus,
  RISK_POLICY_PENDING_TEXT,
} from '@/features/reservation-risk/model/availability';
import type { ApiResult } from '@/lib/api/result';
import { formatLimaDateTime } from '@/lib/dates/lima';
import { describeApiError } from '@/lib/errors/error-catalog';

/**
 * Contexto científico y técnico de la estimación: estado exploratorio, política de riesgo,
 * snapshot y catálogo. Solo usa valores devueltos por la API.
 */
export function RiskFootnote({
  risk,
  catalog,
}: {
  risk: RiskAssessment;
  catalog: ApiResult<ModelCatalog>;
}) {
  const policyApproved = risk.riskPolicyStatus === 'approved' && risk.riskLevel !== null;
  return (
    <div className="space-y-1.5 leading-relaxed">
      <p>
        Estimaciones exploratorias ({risk.validationStatus}), sin calibración validada para uso
        operativo. No existe ensemble ni modelo ganador.{' '}
        {policyApproved
          ? `Nivel informado por la política ${risk.riskPolicyVersion ?? ''}: ${risk.riskLevel}.`
          : RISK_POLICY_PENDING_TEXT}
      </p>
      {risk.snapshot && (
        <p>
          Snapshot {risk.snapshot.featureVersion} · {risk.snapshot.builderVersion} · corte{' '}
          {formatLimaDateTime(risk.snapshot.predictionAt)} · evidencia{' '}
          {risk.snapshot.evidenceSource}
        </p>
      )}
      <p>Fuente: {describeSourceStatus(risk.sourceStatus)}.</p>
      {!catalog.ok && (
        <p>
          Catálogo de modelos no disponible ({describeApiError(catalog.error).title.toLowerCase()}):
          los modelos se identifican por su clave.
        </p>
      )}
    </div>
  );
}
