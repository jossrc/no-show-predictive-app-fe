import type { AttendanceState } from '@/features/operational-optimization/api/attendance.contract';
import type { OverbookingState } from '@/features/operational-optimization/api/overbooking.contract';
import type { SpaceRecoveryState } from '@/features/operational-optimization/api/recovery.contract';
import type { ApiResult } from '@/lib/api/result';
import {
  type DiagnosticSection,
  diagnosticSection,
  type DiagnosticValue,
  reasonsSection,
  responseSections,
  screenContextSection,
} from '@/lib/diagnostics/sections';

/** Diagnóstico de desarrollo de HU-06/07/08. Solo campos presentes en las respuestas. */

type Entries = ReadonlyArray<readonly [string, DiagnosticValue]>;

function responseEntries(result: ApiResult<unknown>): Entries {
  if (result.ok)
    return [
      ['Estado HTTP', result.status],
      ['Request ID', result.requestId],
    ];
  const { error } = result;
  return [
    ['Estado HTTP', error.status],
    ['Código', error.code],
    ['Request ID', error.requestId],
  ];
}

function overbookingEntries(state: OverbookingState): Entries {
  const { authorization, eligibility } = state;
  return [
    ['status', state.status],
    ['eligibility.ruleVersion', eligibility.ruleVersion],
    ['eligibility.eligible', eligibility.eligible],
    ...(authorization
      ? ([
          ['authorizationId', authorization.authorizationId],
          ['authorization.modelVersion', authorization.modelVersion],
          ['authorization.predictionRunId', authorization.predictionRunId],
          ['authorization.researchPolicyVersion', authorization.researchPolicyVersion],
          ['actorKind', authorization.actorKind],
        ] as const)
      : []),
  ];
}

function eligibilityReasons(state: OverbookingState) {
  return [
    ...state.eligibility.reasons,
    ...state.eligibility.candidates.flatMap((candidate) =>
      candidate.reasons.map((reason) => ({
        code: `${candidate.modelKey} · ${reason.code}`,
        message: reason.message,
      })),
    ),
  ];
}

function overbookingSections(result: ApiResult<OverbookingState>): DiagnosticSection[] {
  const state = result.ok ? result.data : null;
  return [
    diagnosticSection('HU-06 · GET …/overbooking-authorization', [
      ...responseEntries(result),
      ...(state ? overbookingEntries(state) : []),
    ]),
    reasonsSection('Motivos de elegibilidad', state ? eligibilityReasons(state) : []),
  ];
}

function attendanceEntries({ registration, outcome, recorded }: AttendanceState): Entries {
  return [
    ['recorded', recorded],
    ['registration.ruleVersion', registration.ruleVersion],
    ['registration.registrable', registration.registrable],
    ['registration.blocker', registration.blocker],
    ['availablePredictionRunIds', registration.availablePredictionRunIds.join(', ')],
    ['outcome.predictionRunId', outcome?.predictionRunId],
    ['outcome.finishedRuleVersion', outcome?.finishedRuleVersion],
    ['comparisonRuleVersion', outcome?.comparisons[0]?.comparisonRuleVersion],
  ];
}

function attendanceSection(result: ApiResult<AttendanceState>): DiagnosticSection {
  return diagnosticSection('HU-07 · GET …/attendance-outcome', [
    ...responseEntries(result),
    ...(result.ok ? attendanceEntries(result.data) : []),
  ]);
}

function recoveryEntries(state: SpaceRecoveryState): Entries {
  return [
    ['recorded', state.recorded],
    ['spaceRecovered', String(state.spaceRecovered)],
    ['preventiveAction.enabled', state.preventiveAction.enabled],
    ['preventiveAction.authorizationId', state.preventiveAction.authorizationId],
    ['registrable', state.registrable],
    ['blocker', state.blocker],
  ];
}

function recoverySection(result: ApiResult<SpaceRecoveryState>): DiagnosticSection {
  return diagnosticSection('HU-08 · GET …/space-recovery-outcome', [
    ...responseEntries(result),
    ...(result.ok ? recoveryEntries(result.data) : []),
  ]);
}

export function operationalDetailDiagnostics(results: {
  overbooking: ApiResult<OverbookingState>;
  attendance: ApiResult<AttendanceState>;
  recovery: ApiResult<SpaceRecoveryState>;
}): DiagnosticSection[] {
  return [
    screenContextSection({
      screen: 'Detalle de reserva',
      feature: 'Gestión operativa',
      story: 'HU-06 · HU-07 · HU-08',
      endpoint: 'GET …/overbooking-authorization · …/attendance-outcome · …/space-recovery-outcome',
    }),
    ...overbookingSections(results.overbooking),
    attendanceSection(results.attendance),
    recoverySection(results.recovery),
  ];
}

/** Diagnóstico de un listado del bloque operativo (alto riesgo o seguimiento). */
export function operationalListDiagnostics(
  context: { feature: string; story: string; endpoint: string },
  params: Record<string, string>,
  result: ApiResult<unknown>,
): DiagnosticSection[] {
  return [
    screenContextSection({ screen: 'Optimización operativa', ...context }),
    diagnosticSection('Parámetros enviados', Object.entries(params)),
    ...responseSections(result),
  ];
}
