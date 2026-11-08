import type { Metadata } from 'next';
import { Suspense } from 'react';

import { Notice } from '@/components/shared/Notice';
import { PageHeader } from '@/components/shared/PageHeader';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { HighRiskResults } from '@/features/operational-optimization/components/HighRiskResults';
import { OperationalBlock } from '@/features/operational-optimization/components/OperationalBlock';
import { OperationalFilters } from '@/features/operational-optimization/components/OperationalFilters';
import { OperationalTableSkeleton } from '@/features/operational-optimization/components/OperationalSkeletons';
import { TrackingResults } from '@/features/operational-optimization/components/TrackingResults';
import { TrackingTabs } from '@/features/operational-optimization/components/TrackingTabs';
import { OPERATIONAL_TITLE } from '@/features/operational-optimization/model/labels';
import { parseOperationalParams } from '@/features/operational-optimization/model/query';
import {
  buildOperationalHref,
  currentOperationalHref,
} from '@/features/operational-optimization/model/urls';
import { resolveModelIdentity } from '@/features/prediction-models/model/model-identity';
import type { RawSearchParams } from '@/features/reservations/model/list-query';
import { todayInLima } from '@/lib/dates/calendar';

export const metadata: Metadata = { title: OPERATIONAL_TITLE };

/**
 * HU-06/07/08 (Figura 17): filtros, reservas con banda Alta del modelo elegido y seguimiento de
 * los horarios gestionados. Solo lecturas al renderizar; los registros requieren confirmación.
 */
export default async function OperationalOptimizationPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { query, notices, periodError } = parseOperationalParams(await searchParams, todayInLima());
  const href = currentOperationalHref(query);
  const model = resolveModelIdentity(query.modelKey).label;

  return (
    <>
      <PageHeader
        title={OPERATIONAL_TITLE}
        description="Marca horarios con alto riesgo de inasistencia para una posible sobreasignación y registra el resultado de las citas gestionadas."
        actions={<RefreshButton />}
      />
      <OperationalFilters
        key={`filters:${buildOperationalHref(query)}`}
        initial={query}
        view={query.view}
      />
      {notices.length > 0 && (
        <Notice tone="warning" title="Ajustamos algunos filtros" className="mb-4">
          <ul className="list-disc pl-4">
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </Notice>
      )}
      {periodError ? (
        <Notice tone="warning" title="Período no válido">
          {periodError} Corrige las fechas en los filtros para consultar.
        </Notice>
      ) : (
        <div className="space-y-6">
          <OperationalBlock
            title="Reservas con alto riesgo"
            description={`Citas con banda relativa Alta según ${model}, a partir de estimaciones ya registradas.`}
          >
            <Suspense
              key={`risk:${href}`}
              fallback={<OperationalTableSkeleton label="Cargando reservas con alto riesgo…" />}
            >
              <HighRiskResults query={query} />
            </Suspense>
          </OperationalBlock>
          <OperationalBlock
            title="Seguimiento operativo"
            description="Horarios gestionados y resultados registrados para su posterior evaluación."
          >
            <TrackingTabs query={query} />
            <Suspense
              key={`track:${href}`}
              fallback={<OperationalTableSkeleton label="Cargando el seguimiento operativo…" />}
            >
              <TrackingResults query={query} />
            </Suspense>
          </OperationalBlock>
        </div>
      )}
    </>
  );
}
