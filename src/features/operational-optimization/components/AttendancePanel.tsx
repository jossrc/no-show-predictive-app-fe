'use client';

import { useRouter } from 'next/navigation';

import { Notice } from '@/components/shared/Notice';
import type { AttendanceState } from '@/features/operational-optimization/api/attendance.contract';
import type { WriteOutcome } from '@/features/operational-optimization/api/operational.actions';
import { AttendanceForm } from '@/features/operational-optimization/components/AttendanceForm';
import { AttendanceRecord } from '@/features/operational-optimization/components/AttendanceRecord';
import { useOperationalWrite } from '@/features/operational-optimization/components/use-operational-write';
import { WriteResultMessage } from '@/features/operational-optimization/components/WriteResultMessage';
import { ATTENDANCE_BLOCKER_MESSAGES } from '@/features/operational-optimization/model/labels';
import { attendanceMode } from '@/features/operational-optimization/model/outcome-view';
import {
  attendanceRunChoices,
  type PredictionRunOption,
} from '@/features/operational-optimization/model/runs';

interface Props {
  reservationId: string;
  state: AttendanceState;
  runs: PredictionRunOption[];
  /** Vuelve a consultar el estado fuera de la ruta (p. ej. el diálogo de seguimiento). */
  onChanged?: () => void;
}

/**
 * HU-07 · Muestra el resultado registrado con su comparación o, si el backend lo permite
 * (`registration.registrable`), el formulario. Si no, explica el bloqueo sin formulario activo.
 */
export function AttendancePanel({ reservationId, state, runs, onChanged }: Props) {
  const router = useRouter();
  const write = useOperationalWrite<WriteOutcome>();
  const reload = () => {
    onChanged?.();
    router.refresh();
  };
  const mode = attendanceMode(state);

  return (
    <div className="space-y-3">
      <div aria-live="polite" className="empty:hidden">
        {write.result && (
          <WriteResultMessage
            result={write.result}
            successTitle="Resultado registrado"
            replayedTitle="El resultado ya estaba registrado"
            successText="Quedó asociado a la estimación para evaluaciones posteriores."
            onRefreshState={reload}
          />
        )}
      </div>
      {mode === 'recorded' && state.outcome && <AttendanceRecord outcome={state.outcome} />}
      {mode === 'form' && (
        <AttendanceForm
          reservationId={reservationId}
          runChoices={attendanceRunChoices(state.registration.availablePredictionRunIds, runs)}
          write={write}
          onSettled={() => onChanged?.()}
        />
      )}
      {mode === 'blocked' && <AttendanceBlocked state={state} />}
    </div>
  );
}

function AttendanceBlocked({ state }: { state: AttendanceState }) {
  const blocker = state.registration.blocker;
  const message = blocker
    ? ATTENDANCE_BLOCKER_MESSAGES[blocker]
    : { title: 'Registro no disponible', text: 'Todavía no se puede registrar el resultado.' };
  return <Notice title={message.title}>{message.text}</Notice>;
}
