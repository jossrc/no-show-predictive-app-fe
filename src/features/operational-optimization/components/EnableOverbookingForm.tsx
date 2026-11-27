'use client';

import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

import { Notice } from '@/components/shared/Notice';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import {
  enableOverbookingAction,
  type WriteOutcome,
} from '@/features/operational-optimization/api/operational.actions';
import type {
  OverbookingCandidate,
  OverbookingState,
} from '@/features/operational-optimization/api/overbooking.contract';
import { ChoiceGroup } from '@/features/operational-optimization/components/ChoiceGroup';
import type { OperationalWrite } from '@/features/operational-optimization/components/use-operational-write';
import {
  EXPERIMENTAL_BAND_NOTICE,
  OVERBOOKING_CONFIRMATION,
} from '@/features/operational-optimization/model/labels';
import {
  candidateLabel,
  eligibleCandidates,
} from '@/features/operational-optimization/model/overbooking-view';
import type { ModelKey } from '@/features/prediction-models/api/contract';
import { formatLimaDateTime } from '@/lib/dates/lima';

interface Props {
  reservationId: string;
  state: OverbookingState;
  write: OperationalWrite<WriteOutcome>;
  /** Modelo que el supervisor está consultando: se preselecciona solo si es elegible. */
  preferredModelKey?: ModelKey;
  /** Tras cualquier respuesta se vuelve a consultar el estado (GET). */
  onSettled: () => void;
}

function initialChoice(
  candidates: OverbookingCandidate[],
  preferred: ModelKey | undefined,
): ModelKey | null {
  if (preferred && candidates.some((candidate) => candidate.modelKey === preferred)) {
    return preferred;
  }
  return candidates.length === 1 ? (candidates[0]?.modelKey ?? null) : null;
}

/**
 * Confirmación de HU-06. Solo se envían `modelKey` y `predictionRunId` del candidato elegible
 * elegido; nunca probabilidad, sede, riesgo ni usuario. Si ambos modelos son elegibles, se elige
 * uno explícitamente (sin promediar ni escoger un «ganador»).
 */
export function EnableOverbookingForm(props: Props) {
  const { reservationId, state, write, preferredModelKey, onSettled } = props;
  const candidates = eligibleCandidates(state);
  const [modelKey, setModelKey] = useState<ModelKey | null>(() =>
    initialChoice(candidates, preferredModelKey),
  );
  const selected = candidates.find((candidate) => candidate.modelKey === modelKey) ?? null;

  const confirm = () => {
    if (!selected) return;
    write.submit(
      () =>
        enableOverbookingAction(reservationId, {
          modelKey: selected.modelKey,
          predictionRunId: selected.predictionRunId,
        }),
      onSettled,
    );
  };

  return (
    <div className="space-y-4">
      {candidates.length > 1 ? (
        <ChoiceGroup
          legend="Estimación que respalda la marca"
          value={modelKey}
          onChange={setModelKey}
          disabled={write.pending}
          options={candidates.map((candidate) => ({
            value: candidate.modelKey,
            label: candidateLabel(candidate),
            description: `Banda relativa: Alto · ${formatLimaDateTime(candidate.scoredAt)}`,
          }))}
        />
      ) : (
        selected && (
          <p className="text-[13px]">
            Estimación que respalda la marca:{' '}
            <span className="font-medium tabular-nums">{candidateLabel(selected)}</span> · Banda
            relativa: Alto
          </p>
        )
      )}
      <Notice tone="warning" title="Confirma la habilitación">
        <p>{OVERBOOKING_CONFIRMATION}</p>
        <p className="mt-1">{EXPERIMENTAL_BAND_NOTICE}</p>
      </Notice>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={write.pending}>
            Cancelar
          </Button>
        </DialogClose>
        <Button onClick={confirm} disabled={!selected || write.pending} aria-busy={write.pending}>
          {write.pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
          {write.pending ? 'Habilitando…' : 'Confirmar habilitación'}
        </Button>
      </DialogFooter>
    </div>
  );
}
