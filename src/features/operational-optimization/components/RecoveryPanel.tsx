'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DescriptionList } from '@/components/shared/DescriptionList';
import { Notice } from '@/components/shared/Notice';
import { Button } from '@/components/ui/button';
import {
  recordSpaceRecoveryAction,
  type WriteOutcome,
} from '@/features/operational-optimization/api/operational.actions';
import type { SpaceRecoveryState } from '@/features/operational-optimization/api/recovery.contract';
import { ChoiceGroup } from '@/features/operational-optimization/components/ChoiceGroup';
import { ConfirmStep } from '@/features/operational-optimization/components/ConfirmStep';
import {
  type OperationalWrite,
  useOperationalWrite,
} from '@/features/operational-optimization/components/use-operational-write';
import { WriteResultMessage } from '@/features/operational-optimization/components/WriteResultMessage';
import {
  formatSpaceRecovered,
  RECOVERY_REQUIRES_OVERBOOKING,
} from '@/features/operational-optimization/model/labels';
import { recoveryMode } from '@/features/operational-optimization/model/outcome-view';
import { formatLimaDateTime } from '@/lib/dates/lima';

type Choice = 'yes' | 'no';
const OPTIONS = [
  { value: 'yes' as const, label: 'Sí se recuperó' },
  { value: 'no' as const, label: 'No se recuperó' },
];

interface Props {
  reservationId: string;
  state: SpaceRecoveryState;
  onChanged?: () => void;
}

/**
 * HU-08 · «¿Espacio recuperado?». Requiere la marca HU-06 y NO depende de la asistencia (HU-07).
 * `false` es un resultado registrado («No recuperado»); `null` es «Sin registro».
 */
export function RecoveryPanel({ reservationId, state, onChanged }: Props) {
  const router = useRouter();
  const write = useOperationalWrite<WriteOutcome>();
  const mode = recoveryMode(state);
  const reload = () => {
    onChanged?.();
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div aria-live="polite" className="empty:hidden">
        {write.result && (
          <WriteResultMessage
            result={write.result}
            successTitle="Resultado registrado"
            replayedTitle="El resultado ya estaba registrado"
            successText="Quedó disponible para su posterior contabilización."
            onRefreshState={reload}
          />
        )}
      </div>
      {mode === 'recorded' && (
        <DescriptionList
          items={[
            { term: 'Espacio recuperado', value: formatSpaceRecovered(state.spaceRecovered) },
            ...(state.outcome
              ? [{ term: 'Registrado el', value: formatLimaDateTime(state.outcome.recordedAt) }]
              : []),
          ]}
        />
      )}
      {mode === 'form' && (
        <RecoveryForm reservationId={reservationId} write={write} onSettled={() => onChanged?.()} />
      )}
      {mode === 'requires_overbooking' && (
        <Notice title="Registro no disponible">{RECOVERY_REQUIRES_OVERBOOKING}</Notice>
      )}
      {mode === 'blocked' && (
        <Notice title="Registro no disponible">Todavía no se puede registrar el resultado.</Notice>
      )}
    </div>
  );
}

function RecoveryForm(props: {
  reservationId: string;
  write: OperationalWrite<WriteOutcome>;
  onSettled: () => void;
}) {
  const { reservationId, write, onSettled } = props;
  const [choice, setChoice] = useState<Choice | null>(null);
  const [confirming, setConfirming] = useState(false);

  const submit = () => {
    if (!choice) return;
    // Booleano JSON estricto: nunca la cadena "true"/"false".
    const spaceRecovered = choice === 'yes';
    write.submit(
      () => recordSpaceRecoveryAction(reservationId, { spaceRecovered }),
      () => {
        setConfirming(false);
        onSettled();
      },
    );
  };

  if (confirming && choice) {
    return (
      <ConfirmStep
        title={`¿Registrar «${formatSpaceRecovered(choice === 'yes')}»?`}
        confirmLabel="Confirmar registro"
        pendingLabel="Registrando…"
        pending={write.pending}
        onConfirm={submit}
        onCancel={() => setConfirming(false)}
      >
        <p>El resultado quedará asociado a la habilitación de este horario.</p>
      </ConfirmStep>
    );
  }
  return (
    <div className="space-y-3">
      <ChoiceGroup
        legend="¿Se recuperó el espacio mediante la acción preventiva?"
        options={OPTIONS}
        value={choice}
        onChange={setChoice}
      />
      <div className="flex justify-end">
        <Button size="sm" disabled={!choice} onClick={() => setConfirming(true)}>
          Registrar resultado
        </Button>
      </div>
    </div>
  );
}
