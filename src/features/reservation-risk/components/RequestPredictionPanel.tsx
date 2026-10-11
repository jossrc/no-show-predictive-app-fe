'use client';

import { LoaderCircle } from 'lucide-react';
import { useId, useRef, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { ModelKey } from '@/features/prediction-models/api/contract';
import {
  type PredictionOutcome,
  requestPredictionAction,
} from '@/features/reservation-risk/api/risk.actions';
import type { PredictionRequest } from '@/features/reservation-risk/api/risk.contract';
import { PredictionOutcomeMessage } from '@/features/reservation-risk/components/PredictionOutcomeMessage';
import type { PredictionRequestAvailability } from '@/features/reservation-risk/model/risk-view';
import type { ApiResult } from '@/lib/api/result';
import { networkFailure } from '@/lib/errors/api-errors';

type Choice = 'compare' | ModelKey;

interface Props {
  reservationId: string;
  modelOptions: { modelKey: ModelKey; label: string }[];
  availability: PredictionRequestAvailability;
}

function initialChoice(options: Props['modelOptions']): Choice {
  if (options.length > 1) return 'compare';
  return options[0]?.modelKey ?? 'compare';
}

function toRequest(choice: Choice): PredictionRequest {
  return choice === 'compare' ? { mode: 'compare' } : { mode: 'single', modelKey: choice };
}

/** Envía la solicitud una sola vez a la vez; el resultado se conserva hasta el siguiente envío. */
function usePredictionRequest(reservationId: string, allowed: boolean) {
  const [outcome, setOutcome] = useState<ApiResult<PredictionOutcome> | null>(null);
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);

  const submit = (choice: Choice) => {
    if (inFlight.current || !allowed) return;
    inFlight.current = true;
    setOutcome(null);
    startTransition(async () => {
      try {
        const result = await requestPredictionAction(reservationId, toRequest(choice));
        startTransition(() => setOutcome(result));
      } catch {
        startTransition(() => setOutcome(networkFailure()));
      } finally {
        inFlight.current = false;
      }
    });
  };
  return { outcome, pending, submit };
}

/**
 * Acción explícita «Calcular estimación». Nunca se ejecuta al cargar, navegar o filtrar; bloquea
 * el doble envío y no reintenta automáticamente. Si la acción no corresponde, no se muestra.
 */
export function RequestPredictionPanel({ reservationId, modelOptions, availability }: Props) {
  const ids = useId();
  const [choice, setChoice] = useState<Choice>(() => initialChoice(modelOptions));
  const { outcome, pending, submit } = usePredictionRequest(reservationId, availability.allowed);

  if (!availability.allowed && !outcome && !pending) return null;

  return (
    <div className="space-y-3 rounded-lg border bg-surface-subtle p-4">
      {availability.allowed && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <PredictionModeSelect
            id={`${ids}-mode`}
            value={choice}
            disabled={pending}
            options={modelOptions}
            onChange={setChoice}
          />
          <Button onClick={() => submit(choice)} disabled={pending} aria-busy={pending}>
            <SubmitLabel pending={pending} />
          </Button>
        </div>
      )}
      {availability.allowed && (
        <p className="text-xs text-muted-foreground">
          El resultado quedará registrado en esta cita.
        </p>
      )}
      <div aria-live="polite">
        {outcome && <PredictionOutcomeMessage outcome={outcome} onRetry={() => submit(choice)} />}
      </div>
    </div>
  );
}

function PredictionModeSelect(props: {
  id: string;
  value: Choice;
  disabled: boolean;
  options: Props['modelOptions'];
  onChange: (choice: Choice) => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Label htmlFor={props.id} className="text-[13px] font-medium text-foreground/80">
        Modelos
      </Label>
      <NativeSelect
        id={props.id}
        className="w-full"
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value as Choice)}
      >
        {props.options.length > 1 && (
          <NativeSelectOption value="compare">Ambos modelos (independientes)</NativeSelectOption>
        )}
        {props.options.map((option) => (
          <NativeSelectOption key={option.modelKey} value={option.modelKey}>
            Solo {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function SubmitLabel({ pending }: { pending: boolean }) {
  if (!pending) return <>Calcular estimación</>;
  return (
    <>
      <LoaderCircle aria-hidden="true" className="animate-spin" />
      Calculando…
    </>
  );
}
