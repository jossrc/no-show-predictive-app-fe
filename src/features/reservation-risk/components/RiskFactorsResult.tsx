import { ChevronRight, Info } from 'lucide-react';

import { Notice } from '@/components/shared/Notice';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import type { RiskFactors } from '@/features/reservation-risk/api/factors.contract';
import { FactorTable } from '@/features/reservation-risk/components/FactorTable';
import { NON_CAUSAL_NOTE, toFactorViews } from '@/features/reservation-risk/model/factors';
import { formatPercentage } from '@/lib/format/percentage';

/** Notas metodológicas del backend, agrupadas en un desplegable accesible. */
function AboutFactors({ data, hasSensitive }: { data: RiskFactors; hasSensitive: boolean }) {
  const { interpretation } = data;
  return (
    <details className="group text-[13px]">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-sm font-medium text-foreground/80 hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-4 transition-transform group-open:rotate-90"
        />
        Acerca de estos factores
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-9 text-muted-foreground">
        <li>{interpretation.note}</li>
        <li>{interpretation.unitsNote}</li>
        {hasSensitive && <li>{interpretation.sensitiveAttributesNote}</li>}
      </ul>
    </details>
  );
}

/** HU-05: factores de un modelo en tabla, con su unidad y sin presentarlos como causas. */
export function RiskFactorsResult({ data }: { data: RiskFactors }) {
  const { explanation, model } = data;
  const factors = toFactorViews(explanation.factors);
  const identity = resolveModelIdentity(model.modelKey, null, model.algorithm);

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted-foreground">
        <span className="font-medium text-foreground">{identity.label}</span> · estimación de{' '}
        <span className="tabular-nums">{formatPercentage(data.percentageNoShow)}</span>
        {factors.length > 0 && (
          <>
            {' '}
            · {factors.length} de {explanation.totalFeatureCount} factores con mayor influencia
          </>
        )}
      </p>
      {factors.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-3 text-[13px] text-muted-foreground">
          Los factores de esta estimación no están disponibles.
        </p>
      ) : (
        <FactorTable factors={factors} outputSpace={explanation.outputSpace} />
      )}
      {data.persistedScore.available && !data.persistedScore.sameModelIdentity && (
        <Notice tone="warning">
          La estimación registrada corresponde a otra versión del modelo; estos factores describen
          la versión actual.
        </Notice>
      )}
      <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" />
        {NON_CAUSAL_NOTE}
      </p>
      <AboutFactors data={data} hasSensitive={factors.some((factor) => factor.sensitive)} />
    </div>
  );
}
