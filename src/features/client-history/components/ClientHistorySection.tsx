'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { ClientDiagnostics } from '@/components/diagnostics/ClientDiagnostics';
import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type ClientHistory,
  DEFAULT_HISTORICAL_AS_OF,
  HISTORICAL_AS_OF_MODES,
  type HistoricalAsOf,
} from '@/features/client-history/api/contract';
import { loadClientHistoryAction } from '@/features/client-history/api/history.actions';
import { HistorySummary } from '@/features/client-history/components/HistorySummary';
import {
  HISTORY_MODE_LABELS,
  historyDiagnostics,
} from '@/features/client-history/model/history-view';
import type { ApiResult } from '@/lib/api/result';
import { networkFailure } from '@/lib/errors/api-errors';
import { describeApiError } from '@/lib/errors/error-catalog';

interface Props {
  reservationId: string;
  /** Resultado inicial (booking_creation) obtenido en el servidor. */
  initial: ApiResult<ClientHistory>;
}

function HistorySkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Cargando historial…</span>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-20" />
      <Skeleton className="h-16" />
    </div>
  );
}

function HistoryPanel({ reservationId, mode, initial }: Props & { mode: HistoricalAsOf }) {
  const query = useQuery({
    queryKey: ['client-history', reservationId, mode],
    queryFn: async () => {
      try {
        return await loadClientHistoryAction(reservationId, mode);
      } catch {
        return networkFailure();
      }
    },
    initialData: mode === DEFAULT_HISTORICAL_AS_OF ? initial : undefined,
  });

  if (query.isFetching || !query.data) return <HistorySkeleton />;

  const result = query.data;
  if (!result.ok) {
    const action = describeApiError(result.error).retryable ? (
      <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
        Reintentar
      </Button>
    ) : null;
    return (
      <ApiErrorNotice
        error={result.error}
        action={action}
        diagnostics={historyDiagnostics(mode, undefined)}
      />
    );
  }
  return (
    <HistorySummary
      history={result.data}
      diagnostics={
        <ClientDiagnostics
          subject={`Historial del cliente · ${HISTORY_MODE_LABELS[mode]}`}
          sections={historyDiagnostics(mode, result)}
        />
      }
    />
  );
}

/** HU-06: historial del cliente al reservar o con la información conocida actualmente. */
export function ClientHistorySection({ reservationId, initial }: Props) {
  const [mode, setMode] = useState<HistoricalAsOf>(DEFAULT_HISTORICAL_AS_OF);

  return (
    <SectionCard
      title="Historial del cliente"
      description="Asistencias y posibles inasistencias registradas."
    >
      <Tabs value={mode} onValueChange={(value) => setMode(value as HistoricalAsOf)}>
        <TabsList className="mb-3 w-full" aria-label="Momento del historial">
          {HISTORICAL_AS_OF_MODES.map((value) => (
            <TabsTrigger key={value} value={value} className="text-[13px]">
              {HISTORY_MODE_LABELS[value]}
            </TabsTrigger>
          ))}
        </TabsList>
        {HISTORICAL_AS_OF_MODES.map((value) => (
          <TabsContent key={value} value={value}>
            <HistoryPanel reservationId={reservationId} mode={value} initial={initial} />
          </TabsContent>
        ))}
      </Tabs>
    </SectionCard>
  );
}
