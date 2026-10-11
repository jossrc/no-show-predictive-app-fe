'use client';

import { CircleCheck } from 'lucide-react';

import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { Notice } from '@/components/shared/Notice';
import { ReasonList } from '@/components/shared/ReasonList';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { RequestIdNote } from '@/components/shared/RequestIdNote';
import { Button } from '@/components/ui/button';
import type { PredictionOutcome } from '@/features/reservation-risk/api/risk.actions';
import type { ApiResult } from '@/lib/api/result';
import { describeApiError } from '@/lib/errors/error-catalog';

const UNCONFIRMED_CODES = new Set(['ML_TIMEOUT', 'TIMEOUT']);

const UNCONFIRMED_DESCRIPTION =
  'No se confirmó el resultado de la operación. El backend o el servicio ML podrían seguir procesándola: actualiza el estado antes de volver a intentarlo.';

interface Props {
  outcome: ApiResult<PredictionOutcome>;
  onRetry: () => void;
}

/** Resultado de la solicitud explícita de predicción (HU-02). Sin reintentos automáticos. */
export function PredictionOutcomeMessage({ outcome, onRetry }: Props) {
  if (outcome.ok) {
    const { created, featureWarnings } = outcome.data;
    return (
      <div
        role="status"
        className="flex gap-2.5 rounded-lg border bg-accent/60 px-3 py-2.5 text-xs"
      >
        <CircleCheck aria-hidden="true" className="mt-px size-3.5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            {created ? 'Predicción registrada' : 'Se reutilizó una predicción existente'}
          </p>
          <p className="text-muted-foreground">
            {created
              ? 'Se creó un nuevo registro exploratorio y la estimación visible se actualizó.'
              : 'El backend ya tenía una estimación para este snapshot y versión de modelo; no se creó un registro nuevo.'}
          </p>
          <ReasonList
            reasons={featureWarnings.map((code) => ({ code, message: 'Aviso de características' }))}
            summary="Avisos de características"
          />
          <RequestIdNote requestId={outcome.requestId} />
        </div>
      </div>
    );
  }

  const { error } = outcome;
  if (error.code === 'NOT_SCORABLE') {
    return (
      <Notice tone="warning" title="Reserva no evaluable">
        <p>No es posible generar una predicción con la información disponible.</p>
        <div className="mt-1.5 space-y-1.5">
          <ReasonList reasons={error.reasons} />
          <RequestIdNote requestId={error.requestId} />
        </div>
      </Notice>
    );
  }

  const unconfirmed = UNCONFIRMED_CODES.has(error.code);
  const retryable = describeApiError(error).retryable;
  return (
    <ApiErrorNotice
      error={error}
      description={unconfirmed ? UNCONFIRMED_DESCRIPTION : undefined}
      action={
        <>
          {unconfirmed && <RefreshButton label="Actualizar estado" />}
          {retryable && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </>
      }
    />
  );
}
