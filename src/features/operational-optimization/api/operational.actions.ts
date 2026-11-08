'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';

import {
  type AttendanceState,
  recordAttendanceRequestSchema,
} from '@/features/operational-optimization/api/attendance.contract';
import {
  enableOverbooking,
  getAttendanceState,
  getOverbookingState,
  getSpaceRecoveryState,
  recordAttendance,
  recordSpaceRecovery,
} from '@/features/operational-optimization/api/operational.server';
import {
  enableOverbookingRequestSchema,
  type OverbookingState,
} from '@/features/operational-optimization/api/overbooking.contract';
import {
  recordSpaceRecoveryRequestSchema,
  type SpaceRecoveryState,
} from '@/features/operational-optimization/api/recovery.contract';
import type { AttendanceStatus } from '@/features/operational-optimization/api/summary.contract';
import {
  type PredictionRunOption,
  toPredictionRunOptions,
} from '@/features/operational-optimization/model/runs';
import { getReservationRisk } from '@/features/reservation-risk/api/risk.server';
import type { ApiResult } from '@/lib/api/result';
import { decimalIdSchema } from '@/lib/api/schemas';
import { invalidInputFailure } from '@/lib/errors/api-errors';

/**
 * Server Actions de HU-06/07/08. Next.js valida el origen (CSRF) de cada invocación; además, toda
 * entrada se valida aquí con Zod antes de contactar a Fastify. Los POST nunca se reintentan
 * automáticamente: la idempotencia del backend es una protección adicional, no un mecanismo.
 */

/**
 * Tras un conflicto o un resultado no confirmado, el estado del servidor puede haber cambiado: se
 * vuelven a consultar (GET) los Server Components de la ruta actual, nunca se repite el POST.
 */
const REFRESH_ON_ERROR = new Set([
  'OVERBOOKING_NOT_ELIGIBLE',
  'OVERBOOKING_ALREADY_ENABLED_CONFLICT',
  'PREDICTION_RESERVATION_MISMATCH',
  'ATTENDANCE_ALREADY_RECORDED_CONFLICT',
  'APPOINTMENT_NOT_FINISHED',
  'RESERVATION_CANCELLED',
  'PREDICTION_REQUIRED',
  'PREDICTION_AFTER_APPOINTMENT',
  'PREVENTIVE_ACTION_REQUIRED',
  'SPACE_RECOVERY_ALREADY_RECORDED_CONFLICT',
  'TIMEOUT',
]);

export interface WriteOutcome {
  /** 201: se creó el registro. */
  created: boolean;
  /** 200 con `replayed=true`: el mismo registro ya existía (reintento idéntico). */
  replayed: boolean;
}

function finishWrite<T extends { replayed: boolean }, U>(
  result: ApiResult<T>,
  map: (data: T) => U,
): ApiResult<WriteOutcome & U> {
  if (!result.ok) {
    if (REFRESH_ON_ERROR.has(result.error.code)) refresh();
    return result;
  }
  refresh();
  return {
    ok: true,
    status: result.status,
    requestId: result.requestId,
    data: { created: result.status === 201, replayed: result.data.replayed, ...map(result.data) },
  };
}

/* Lecturas bajo demanda (al abrir un diálogo): sin escrituras ni inferencia. */

export async function loadOverbookingStateAction(
  reservationId: string,
): Promise<ApiResult<OverbookingState>> {
  const input = decimalIdSchema.safeParse(reservationId);
  if (!input.success) return invalidInputFailure();
  return getOverbookingState(input.data);
}

export interface OutcomeStates {
  attendance: ApiResult<AttendanceState>;
  recovery: ApiResult<SpaceRecoveryState>;
  /** Descripción de las predicciones registradas (GET …/risk) para elegir el run asociado. */
  runs: PredictionRunOption[];
}

export async function loadOutcomeStatesAction(reservationId: string): Promise<OutcomeStates> {
  const input = decimalIdSchema.safeParse(reservationId);
  if (!input.success) {
    return { attendance: invalidInputFailure(), recovery: invalidInputFailure(), runs: [] };
  }
  const [attendance, recovery, risk] = await Promise.all([
    getAttendanceState(input.data),
    getSpaceRecoveryState(input.data),
    getReservationRisk(input.data),
  ]);
  return { attendance, recovery, runs: risk.ok ? toPredictionRunOptions(risk.data.models) : [] };
}

/* HU-06 */

const enableInputSchema = z.object({
  reservationId: decimalIdSchema,
  request: enableOverbookingRequestSchema,
});

export async function enableOverbookingAction(
  reservationId: string,
  request: unknown,
): Promise<ApiResult<WriteOutcome & { enabledAt: string }>> {
  const input = enableInputSchema.safeParse({ reservationId, request });
  if (!input.success) return invalidInputFailure();
  const result = await enableOverbooking(input.data.reservationId, input.data.request);
  return finishWrite(result, (data) => ({ enabledAt: data.enabledAt }));
}

/* HU-07 */

const attendanceInputSchema = z.object({
  reservationId: decimalIdSchema,
  request: recordAttendanceRequestSchema,
});

export async function recordAttendanceAction(
  reservationId: string,
  request: unknown,
): Promise<ApiResult<WriteOutcome & { attendanceStatus: AttendanceStatus }>> {
  const input = attendanceInputSchema.safeParse({ reservationId, request });
  if (!input.success) return invalidInputFailure();
  const result = await recordAttendance(input.data.reservationId, input.data.request);
  return finishWrite(result, (data) => ({ attendanceStatus: data.attendanceStatus }));
}

/* HU-08 */

const recoveryInputSchema = z.object({
  reservationId: decimalIdSchema,
  request: recordSpaceRecoveryRequestSchema,
});

export async function recordSpaceRecoveryAction(
  reservationId: string,
  request: unknown,
): Promise<ApiResult<WriteOutcome & { spaceRecovered: boolean }>> {
  const input = recoveryInputSchema.safeParse({ reservationId, request });
  if (!input.success) return invalidInputFailure();
  const result = await recordSpaceRecovery(input.data.reservationId, input.data.request);
  return finishWrite(result, (data) => ({ spaceRecovered: data.spaceRecovered }));
}
