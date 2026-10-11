'use client';

import dynamic from 'next/dynamic';

import { EmptyState } from '@/components/shared/EmptyState';
import { Notice } from '@/components/shared/Notice';
import { RequestIdNote } from '@/components/shared/RequestIdNote';
import { Skeleton } from '@/components/ui/skeleton';
import { ModelVersionNote } from '@/features/prediction-models/components/ModelVersionNote';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import type { RiskFactors } from '@/features/reservation-risk/api/factors.contract';
import { FactorTable } from '@/features/reservation-risk/components/FactorTable';
import {
  formatContribution,
  OUTPUT_SPACE_LABELS,
  OUTPUT_SPACE_UNIT_HINTS,
  toFactorViews,
} from '@/features/reservation-risk/model/factors';
import { formatPercentage } from '@/lib/format/percentage';

// Recharts se carga solo cuando existe una explicación que dibujar.
const RiskFactorsChart = dynamic(
  () => import('@/features/reservation-risk/components/RiskFactorsChart'),
  {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full" />,
  },
);

/** HU-05: explicación local de un modelo, con unidades y nota metodológica. */
export function RiskFactorsResult({
  data,
  requestId,
}: {
  data: RiskFactors;
  requestId: string | null;
}) {
  const { explanation, model, interpretation } = data;
  const factors = toFactorViews(explanation.factors);
  const identity = resolveModelIdentity(model.modelKey, null, model.algorithm);
  const hasSensitive = factors.some((factor) => factor.sensitive);

  const meta = [
    { term: 'Modelo explicado', value: identity.label },
    { term: 'Factores visibles', value: `${factors.length} de ${explanation.totalFeatureCount}` },
    { term: 'Espacio de salida', value: OUTPUT_SPACE_LABELS[explanation.outputSpace] },
    { term: 'Valor base', value: formatContribution(explanation.baseValue) },
    { term: 'Resto de factores', value: formatContribution(explanation.otherFeaturesContribution) },
    { term: 'Probabilidad explicada', value: formatPercentage(data.percentageNoShow) },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-surface-subtle p-3.5">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
          {meta.map((item) => (
            <div key={item.term} className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">{item.term}</dt>
              <dd className="text-xs font-medium tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2.5 border-t pt-2">
          <ModelVersionNote modelVersion={model.modelVersion} modelHash={model.modelHash} />
        </div>
      </div>
      {factors.length === 0 ? (
        <EmptyState
          title="El modelo no informó factores para esta estimación"
          description="La explicación se generó, pero no contiene factores locales que mostrar."
          className="py-6"
        />
      ) : (
        <figure className="space-y-3">
          <RiskFactorsChart factors={factors} outputSpace={explanation.outputSpace} />
          <figcaption className="text-[11px] text-muted-foreground">
            {OUTPUT_SPACE_UNIT_HINTS[explanation.outputSpace]} Unidades informadas por la API:{' '}
            <code className="font-mono">{explanation.units}</code>.
          </figcaption>
          <FactorTable factors={factors} unitsLabel={explanation.units} />
        </figure>
      )}
      {data.persistedScore.available && !data.persistedScore.sameModelIdentity && (
        <Notice tone="warning">
          El score guardado corresponde a otra versión del modelo; esta explicación describe la
          versión actual.
        </Notice>
      )}
      <Notice title="Nota metodológica">
        <p>{interpretation.note}</p>
        <p>{interpretation.unitsNote}</p>
        {hasSensitive && <p>{interpretation.sensitiveAttributesNote}</p>}
      </Notice>
      <RequestIdNote requestId={requestId} />
    </div>
  );
}
