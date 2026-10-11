'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { useId, useState } from 'react';

import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { Notice } from '@/components/shared/Notice';
import { ReasonList } from '@/components/shared/ReasonList';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import type { ModelKey } from '@/features/prediction-models/api/contract';
import { DEFAULT_TOP_K } from '@/features/reservation-risk/api/factors.contract';
import { loadRiskFactorsAction } from '@/features/reservation-risk/api/risk.actions';
import { RiskFactorsResult } from '@/features/reservation-risk/components/RiskFactorsResult';
import type { ApiError } from '@/lib/api/result';
import { networkFailure } from '@/lib/errors/api-errors';
import { describeApiError } from '@/lib/errors/error-catalog';

const TOP_K_OPTIONS = [3, 5, 10] as const;

type ModelOption = { modelKey: ModelKey; label: string };
type FactorsRequest = { modelKey: ModelKey; topK: number };

interface Props {
  reservationId: string;
  modelOptions: ModelOption[];
  /** Motivo por el que no corresponde solicitar una explicación (p. ej. NOT_SCORABLE). */
  unavailableReason: string | null;
}

function useRiskFactors(reservationId: string, request: FactorsRequest | null) {
  return useQuery({
    queryKey: ['risk-factors', reservationId, request?.modelKey, request?.topK],
    queryFn: async () => {
      if (!request) throw new Error('Solicitud de explicación ausente');
      try {
        return await loadRiskFactorsAction(reservationId, request.modelKey, request.topK);
      } catch {
        return networkFailure();
      }
    },
    enabled: request !== null,
  });
}

/**
 * HU-05 bajo demanda: la explicación se solicita solo al pulsar «Ver explicación» y para un
 * único modelo. Cambiar los selectores no dispara llamadas.
 */
export function RiskFactorsPanel({ reservationId, modelOptions, unavailableReason }: Props) {
  const [request, setRequest] = useState<FactorsRequest | null>(null);
  const query = useRiskFactors(reservationId, request);
  const result = query.data;

  if (unavailableReason || modelOptions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {unavailableReason ?? 'No hay modelos disponibles para explicar.'}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <FactorsControls options={modelOptions} busy={query.isFetching} onRequest={setRequest} />
      <div aria-live="polite" aria-busy={query.isFetching}>
        {query.isFetching && (
          <div role="status" className="space-y-2">
            <span className="sr-only">Cargando explicación…</span>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
        {!query.isFetching && result && !result.ok && (
          <FactorsError error={result.error} onRetry={() => void query.refetch()} />
        )}
        {!query.isFetching && result?.ok && (
          <RiskFactorsResult data={result.data} requestId={result.requestId} />
        )}
      </div>
    </div>
  );
}

function FactorsControls(props: {
  options: ModelOption[];
  busy: boolean;
  onRequest: (request: FactorsRequest) => void;
}) {
  const ids = useId();
  const [modelKey, setModelKey] = useState<ModelKey>(
    props.options[0]?.modelKey ?? 'random_forest_full_v1',
  );
  const [topK, setTopK] = useState<number>(DEFAULT_TOP_K);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5 sm:w-56">
        <Label htmlFor={`${ids}-model`} className="text-xs font-medium text-muted-foreground">
          Modelo
        </Label>
        <NativeSelect
          id={`${ids}-model`}
          className="w-full"
          value={modelKey}
          onChange={(event) => setModelKey(event.target.value as ModelKey)}
        >
          {props.options.map((option) => (
            <NativeSelectOption key={option.modelKey} value={option.modelKey}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5 sm:w-36">
        <Label htmlFor={`${ids}-topk`} className="text-xs font-medium text-muted-foreground">
          Factores
        </Label>
        <NativeSelect
          id={`${ids}-topk`}
          className="w-full"
          value={String(topK)}
          onChange={(event) => setTopK(Number(event.target.value))}
        >
          {TOP_K_OPTIONS.map((value) => (
            <NativeSelectOption key={value} value={String(value)}>
              Top {value}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Button
        variant="outline"
        disabled={props.busy}
        onClick={() => props.onRequest({ modelKey, topK })}
      >
        <Sparkles aria-hidden="true" />
        Ver explicación
      </Button>
    </div>
  );
}

function FactorsError({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  if (error.code === 'EXPLANATION_SNAPSHOT_UNAVAILABLE') {
    return (
      <Notice tone="warning" title="Explicación no disponible">
        <p>No se dispone de información suficiente para explicar esta estimación.</p>
        <div className="mt-1.5">
          <ReasonList reasons={error.reasons} summary="Detalles técnicos" />
        </div>
      </Notice>
    );
  }
  const action = describeApiError(error).retryable ? (
    <Button variant="outline" size="sm" onClick={onRetry}>
      Reintentar
    </Button>
  ) : null;
  return <ApiErrorNotice error={error} action={action} />;
}
