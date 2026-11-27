import type { ReactNode } from 'react';

import { DevelopmentDiagnostics } from '@/components/diagnostics/DevelopmentDiagnostics';
import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { SectionCard } from '@/components/shared/SectionCard';
import {
  getAttendanceState,
  getOverbookingState,
  getSpaceRecoveryState,
} from '@/features/operational-optimization/api/operational.server';
import type { OverbookingState } from '@/features/operational-optimization/api/overbooking.contract';
import { AttendancePanel } from '@/features/operational-optimization/components/AttendancePanel';
import { OverbookingDialog } from '@/features/operational-optimization/components/OverbookingDialog';
import {
  EnabledAuthorization,
  IneligibleReasons,
} from '@/features/operational-optimization/components/OverbookingStateViews';
import { RecoveryPanel } from '@/features/operational-optimization/components/RecoveryPanel';
import { operationalDetailDiagnostics } from '@/features/operational-optimization/model/diagnostics';
import { operationalErrorText } from '@/features/operational-optimization/model/errors';
import {
  candidateLabel,
  canEnableOverbooking,
  eligibleCandidates,
  ineligibilityReasons,
} from '@/features/operational-optimization/model/overbooking-view';
import { toPredictionRunOptions } from '@/features/operational-optimization/model/runs';
import type { RiskAssessment } from '@/features/reservation-risk/api/risk.contract';
import type { ApiResult } from '@/lib/api/result';

const TITLE = 'Gestión operativa';

interface Props {
  reservationId: string;
  /** Contexto de la cita para el diálogo de confirmación (reserva, fecha y hora en Lima). */
  context: string;
  risk: ApiResult<RiskAssessment>;
}

/**
 * HU-06/07/08 en el detalle: marca para sobreasignación, asistencia real y espacio recuperado.
 * Cada bloque gestiona su propio error: un fallo no oculta los datos ni las estimaciones de
 * Sprint 01. Solo lecturas al renderizar; los registros requieren una acción confirmada.
 */
export async function OperationalDetailSection({ reservationId, context, risk }: Props) {
  const [overbooking, attendance, recovery] = await Promise.all([
    getOverbookingState(reservationId),
    getAttendanceState(reservationId),
    getSpaceRecoveryState(reservationId),
  ]);
  const runs = risk.ok ? toPredictionRunOptions(risk.data.models) : [];
  const diagnostics = (
    <DevelopmentDiagnostics
      subject={TITLE}
      sections={operationalDetailDiagnostics({ overbooking, attendance, recovery })}
    />
  );

  return (
    <SectionCard
      title={TITLE}
      description="Sobreasignación preventiva y resultados de la cita."
      actions={diagnostics}
    >
      <div className="divide-y [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
        <Block title="Sobreasignación">
          <OverbookingBlock reservationId={reservationId} context={context} result={overbooking} />
        </Block>
        <Block title="¿Asistió?">
          {attendance.ok ? (
            <AttendancePanel reservationId={reservationId} state={attendance.data} runs={runs} />
          ) : (
            <StateError result={attendance} />
          )}
        </Block>
        <Block title="¿Espacio recuperado?">
          {recovery.ok ? (
            <RecoveryPanel reservationId={reservationId} state={recovery.data} />
          ) : (
            <StateError result={recovery} />
          )}
        </Block>
      </div>
    </SectionCard>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function StateError({ result }: { result: Extract<ApiResult<unknown>, { ok: false }> }) {
  return (
    <ApiErrorNotice
      error={result.error}
      {...operationalErrorText(result.error)}
      action={<RefreshButton label="Reintentar" size="sm" />}
    />
  );
}

function OverbookingBlock(props: {
  reservationId: string;
  context: string;
  result: ApiResult<OverbookingState>;
}) {
  const { reservationId, context, result } = props;
  if (!result.ok) return <StateError result={result} />;
  const state = result.data;
  const enableable = canEnableOverbooking(state);
  return (
    <div className="space-y-3">
      <OverbookingContent state={state} />
      {/* Posición estable: el diálogo sigue abierto aunque la marca recién creada cambie el estado. */}
      <OverbookingDialog reservationId={reservationId} context={context} showTrigger={enableable} />
    </div>
  );
}

function OverbookingContent({ state }: { state: OverbookingState }) {
  if (state.enabled) return <EnabledAuthorization authorization={state.authorization} />;
  if (!canEnableOverbooking(state)) {
    return <IneligibleReasons reasons={ineligibilityReasons(state)} />;
  }
  return (
    <p className="text-[13px] text-pretty text-muted-foreground">
      La estimación registrada ubica esta cita en la banda relativa Alta:{' '}
      <span className="text-foreground tabular-nums">
        {eligibleCandidates(state).map(candidateLabel).join(' · ')}
      </span>
      . Puedes marcar el horario para que Call Center evalúe una sobreasignación preventiva.
    </p>
  );
}
