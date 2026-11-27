'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  recordAttendanceAction,
  type WriteOutcome,
} from '@/features/operational-optimization/api/operational.actions';
import type { AttendanceStatus } from '@/features/operational-optimization/api/summary.contract';
import { ChoiceGroup } from '@/features/operational-optimization/components/ChoiceGroup';
import { ConfirmStep } from '@/features/operational-optimization/components/ConfirmStep';
import type { OperationalWrite } from '@/features/operational-optimization/components/use-operational-write';
import {
  ATTENDANCE_LABELS,
  ATTENDANCE_OPTION_LABELS,
} from '@/features/operational-optimization/model/labels';
import type { RunChoice } from '@/features/operational-optimization/model/runs';

interface Props {
  reservationId: string;
  /** Derivadas EXCLUSIVAMENTE de `registration.availablePredictionRunIds`. */
  runChoices: RunChoice[];
  write: OperationalWrite<WriteOutcome>;
  onSettled: () => void;
}

const STATUS_OPTIONS = (['ATTENDED', 'NO_SHOW'] as const).map((value) => ({
  value,
  label: ATTENDANCE_OPTION_LABELS[value],
}));

/**
 * HU-07 · «¿Asistió?» con selección explícita (sin preselección) y confirmación previa. Si hay
 * varias predicciones registrables, recepción elige cuál asociar; si hay una, se asocia esa.
 */
export function AttendanceForm({ reservationId, runChoices, write, onSettled }: Props) {
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [runId, setRunId] = useState<string | null>(() =>
    runChoices.length === 1 ? (runChoices[0]?.predictionRunId ?? null) : null,
  );
  const [confirming, setConfirming] = useState(false);
  const run = runChoices.find((choice) => choice.predictionRunId === runId) ?? null;

  const submit = () => {
    if (!status || !run) return;
    write.submit(
      () =>
        recordAttendanceAction(reservationId, {
          attendanceStatus: status,
          predictionRunId: run.predictionRunId,
        }),
      (outcome) => {
        setConfirming(false);
        onSettled();
        if (outcome.ok) setStatus(null);
      },
    );
  };

  if (confirming && status && run) {
    return (
      <ConfirmStep
        title={`¿Registrar «${ATTENDANCE_LABELS[status]}»?`}
        confirmLabel="Confirmar registro"
        pendingLabel="Registrando…"
        pending={write.pending}
        onConfirm={submit}
        onCancel={() => setConfirming(false)}
      >
        <p>Se asociará a la estimación: {run.label}.</p>
      </ConfirmStep>
    );
  }

  return (
    <div className="space-y-3">
      <ChoiceGroup
        legend="¿El cliente asistió a la cita?"
        options={STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
      />
      {runChoices.length > 1 ? (
        <ChoiceGroup
          legend="Estimación a la que se asocia el resultado"
          options={runChoices.map((choice) => ({
            value: choice.predictionRunId,
            label: choice.label,
          }))}
          value={runId}
          onChange={setRunId}
        />
      ) : (
        run && (
          <p className="text-xs text-muted-foreground">Se asociará a la estimación: {run.label}.</p>
        )
      )}
      <div className="flex justify-end">
        <Button size="sm" disabled={!status || !run} onClick={() => setConfirming(true)}>
          Registrar resultado
        </Button>
      </div>
    </div>
  );
}
