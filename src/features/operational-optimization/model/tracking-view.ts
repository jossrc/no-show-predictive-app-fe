import type { AttendanceOutcome } from '@/features/operational-optimization/api/attendance.contract';
import type { OverbookingAuthorization } from '@/features/operational-optimization/api/overbooking.contract';
import type { SpaceRecoveryOutcome } from '@/features/operational-optimization/api/recovery.contract';
import {
  ATTENDANCE_LABELS,
  formatSpaceRecovered,
} from '@/features/operational-optimization/model/labels';
import { toComparisonViews } from '@/features/operational-optimization/model/outcome-view';
import { modelLabel } from '@/features/operational-optimization/model/overbooking-view';
import { formatAppointmentContext, formatClinicLabel } from '@/features/reservations/model/labels';
import { buildDetailHref } from '@/features/reservations/model/list-url';
import { formatLimaDate, formatLimaDateTime, formatLimaTime } from '@/lib/dates/lima';
import { formatPercentage } from '@/lib/format/percentage';

/** Filas de los listados persistidos del seguimiento (fechas en Lima, IDs como cadenas). */

interface BaseRow {
  key: string;
  reservationId: string;
  detailHref: string;
  context: string;
  date: string;
  time: string;
  clinicLabel: string;
  recordedAt: string;
}

function baseRow(
  record: { reservationId: string; appointmentAt: string; clinicId: number },
  key: string,
  recordedAt: string,
  backHref: string,
): BaseRow {
  return {
    key,
    reservationId: record.reservationId,
    detailHref: buildDetailHref(record.reservationId, backHref),
    context: formatAppointmentContext(record.reservationId, record),
    date: formatLimaDate(record.appointmentAt),
    time: formatLimaTime(record.appointmentAt),
    clinicLabel: formatClinicLabel(record.clinicId),
    recordedAt: formatLimaDateTime(recordedAt),
  };
}

export interface AuthorizationRowView extends BaseRow {
  statusLabel: string;
  estimateText: string;
}

export function toAuthorizationRow(
  record: OverbookingAuthorization,
  backHref: string,
): AuthorizationRowView {
  return {
    ...baseRow(record, record.authorizationId, record.enabledAt, backHref),
    statusLabel: record.statusLabel,
    estimateText: `Alto · ${modelLabel(record.modelKey)} ${formatPercentage(record.probabilityNoShowAtAuthorization * 100)}`,
  };
}

export interface AttendanceRowView extends BaseRow {
  resultLabel: string;
  comparisons: { modelKey: string; text: string }[];
  notice: string;
}

export function toAttendanceRow(record: AttendanceOutcome, backHref: string): AttendanceRowView {
  return {
    ...baseRow(record, record.attendanceOutcomeId, record.recordedAt, backHref),
    resultLabel: ATTENDANCE_LABELS[record.attendanceStatus],
    comparisons: toComparisonViews(record.comparisons).map((view) => ({
      modelKey: view.modelKey,
      text: `${view.label}: ${view.matchText}`,
    })),
    notice: record.comparisonNotice,
  };
}

export interface RecoveryRowView extends BaseRow {
  resultLabel: string;
}

export function toRecoveryRow(record: SpaceRecoveryOutcome, backHref: string): RecoveryRowView {
  return {
    ...baseRow(record, record.recoveryOutcomeId, record.recordedAt, backHref),
    // `false` es un registro explícito («No recuperado»), nunca «Sin registro».
    resultLabel: formatSpaceRecovered(record.spaceRecovered),
  };
}
