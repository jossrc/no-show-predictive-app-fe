'use client';

import { CircleCheck, RefreshCw } from 'lucide-react';

import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { Button } from '@/components/ui/button';
import type { WriteOutcome } from '@/features/operational-optimization/api/operational.actions';
import { operationalErrorText } from '@/features/operational-optimization/model/errors';
import type { ApiResult } from '@/lib/api/result';
import { describeApiError } from '@/lib/errors/error-catalog';

/** Sin respuesta confirmada: el POST pudo o no haberse aplicado. */
const UNCONFIRMED_CODES = new Set(['TIMEOUT', 'NETWORK_ERROR']);

interface Props {
  result: ApiResult<WriteOutcome>;
  successTitle: string;
  /** Texto cuando el backend respondió 200 `replayed` (el mismo registro ya existía). */
  replayedTitle: string;
  successText: string;
  /** Vuelve a consultar el estado (GET); nunca repite el POST. */
  onRefreshState: () => void;
}

/** Resultado de un registro operativo (201/200, conflicto 409 o estado desconocido). */
export function WriteResultMessage(props: Props) {
  const { result, successTitle, replayedTitle, successText, onRefreshState } = props;
  if (result.ok) {
    return (
      <div role="status" className="flex gap-2.5 rounded-lg border bg-card px-3.5 py-3 text-[13px]">
        <CircleCheck aria-hidden="true" className="mt-px size-4 shrink-0 text-success" />
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">
            {result.data.replayed ? replayedTitle : successTitle}
          </p>
          <p className="text-muted-foreground">{successText}</p>
        </div>
      </div>
    );
  }

  const unconfirmed = UNCONFIRMED_CODES.has(result.error.code);
  const texts = operationalErrorText(result.error);
  return (
    <ApiErrorNotice
      error={result.error}
      title={texts.title}
      description={
        unconfirmed
          ? 'No podemos confirmar si se guardó. Actualiza el estado antes de volver a intentarlo.'
          : (texts.description ?? describeApiError(result.error).description)
      }
      action={
        <Button variant="outline" size="sm" onClick={onRefreshState}>
          <RefreshCw aria-hidden="true" />
          Actualizar estado
        </Button>
      }
    />
  );
}
