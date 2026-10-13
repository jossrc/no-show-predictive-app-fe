import { Notice } from '@/components/shared/Notice';
import type { RiskFactors } from '@/features/reservation-risk/api/factors.contract';
import { FactorTable } from '@/features/reservation-risk/components/FactorTable';
import { toFactorViews } from '@/features/reservation-risk/model/factors';

/** HU-05: factores de mayor influencia, sin textos metodológicos. */
export function RiskFactorsResult({ data }: { data: RiskFactors }) {
  const factors = toFactorViews(data.explanation.factors);

  return (
    <div className="space-y-4">
      {factors.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-3 text-[13px] text-muted-foreground">
          Los factores de esta estimación no están disponibles.
        </p>
      ) : (
        <FactorTable factors={factors} />
      )}
      {data.persistedScore.available && !data.persistedScore.sameModelIdentity && (
        <Notice tone="warning">
          La estimación registrada corresponde a otra versión del modelo; estos factores describen
          la versión actual.
        </Notice>
      )}
    </div>
  );
}
