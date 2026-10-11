'use client';

import { CircleCheck } from 'lucide-react';

import { ClientDiagnostics } from '@/components/diagnostics/ClientDiagnostics';
import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { Notice } from '@/components/shared/Notice';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { Button } from '@/components/ui/button';
import type { PredictionOutcome } from '@/features/reservation-risk/api/risk.actions';
import { predictionDiagnostics } from '@/features/reservation-risk/model/diagnostics';
import type { ApiResult } from '@/lib/api/result';
import { describeApiError } from '@/lib/errors/error-catalog';

const UNCONFIRMED_CODES = new Set(['ML_TIMEOUT', 'TIMEOUT']);
const SUBJECT = 'Cálculo de la estimación';

interface Props {
  outcome: ApiResult<PredictionOutcome>;
  onRetry: () => void;
}

/** Resultado de la solicitud explícita de predicción (HU-02). Sin reintentos automáticos. */
export function PredictionOutcomeMessage({ outcome, onRetry }: Props) {
  const diagnostics = predictionDiagnostics(outcome);
  if (outcome.ok) {
    const { created } = outcome.data;
    return (
      <div role="status" className="flex gap-2.5 rounded-lg border bg-card px-3.5 py-3 text-[13px]">
        <CircleCheck aria-hidden="true" className="mt-px size-4 shrink-0 text-success" />
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">
            {created ? 'Estimación calculada' : 'Ya existía una estimación'}
          </p>
          <p className="text-muted-foreground">
            {created
              ? 'El resultado se muestra en esta sección.'
              : 'Se muestra la estimación registrada anteriormente; no se creó una nueva.'}
          </p>
          <ClientDiagnostics subject={SUBJECT} sections={diagnostics} variant="link" />
        </div>
      </div>
    );
  }

  const { error } = outcome;
  if (error.code === 'NOT_SCORABLE') {
    const { title, description } = describeApiError(error);
    return (
      <Notice title={title}>
        <p>{description}</p>
        <ClientDiagnostics subject={SUBJECT} sections={diagnostics} variant="link" />
      </Notice>
    );
  }

  const unconfirmed = UNCONFIRMED_CODES.has(error.code);
  const { description, retryable } = describeApiError(error);
  return (
    <ApiErrorNotice
      error={error}
      description={
        unconfirmed ? `${description} Actualiza el estado antes de volver a intentarlo.` : undefined
      }
      diagnostics={diagnostics.slice(0, 1)}
      action={
        <>
          {unconfirmed && <RefreshButton label="Actualizar estado" size="sm" />}
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
