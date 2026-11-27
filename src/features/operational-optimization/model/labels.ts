import type { AttendanceBlocker } from '@/features/operational-optimization/api/attendance.contract';
import type { AttendanceStatus } from '@/features/operational-optimization/api/summary.contract';

/**
 * Textos de negocio de la gestión operativa (HU-06/07/08). Distinguen siempre la reserva en la
 * agenda (`reservationStatus`) de la gestión predictiva propia (marca, asistencia, recuperación).
 */

export const OPERATIONAL_TITLE = 'Optimización operativa';

export const OVERBOOKING_ENABLED_LABEL = 'Habilitado para sobreasignación';
export const OVERBOOKING_NOT_ENABLED_LABEL = 'No habilitado';
/** `overbooking=null`: el almacén no respondió; nunca se presenta como «No habilitado». */
export const MANAGEMENT_UNAVAILABLE_LABEL = 'Estado de gestión no disponible';

export const OVERBOOKING_MEANING =
  'Es una marca para que Call Center evalúe el horario más adelante. No crea una nueva cita, no libera el horario ni modifica la agenda principal.';

export const OVERBOOKING_CONFIRMATION =
  'Se marcará este horario para evaluación posterior por Call Center. No se creará una nueva cita ni se modificará la agenda principal.';

export const EXPERIMENTAL_BAND_NOTICE =
  'La banda «Alto» es experimental y provisional: orienta la revisión, pero no es una certeza de inasistencia.';

export const ATTENDANCE_LABELS: Readonly<Record<AttendanceStatus, string>> = {
  ATTENDED: 'Asistió',
  NO_SHOW: 'No asistió',
};

export const ATTENDANCE_OPTION_LABELS: Readonly<Record<AttendanceStatus, string>> = {
  ATTENDED: 'Sí asistió',
  NO_SHOW: 'No asistió',
};

export const RECOVERY_LABELS = {
  recovered: 'Recuperado',
  notRecovered: 'No recuperado',
  none: 'Sin registro',
} as const;

/** `true` ⇒ Recuperado · `false` ⇒ No recuperado · `null` ⇒ Sin registro (nunca «No»). */
export function formatSpaceRecovered(value: boolean | null): string {
  if (value === null) return RECOVERY_LABELS.none;
  return value ? RECOVERY_LABELS.recovered : RECOVERY_LABELS.notRecovered;
}

export const IMMUTABLE_RECORD_NOTICE =
  'Una vez guardado, el registro no podrá modificarse ni eliminarse.';

export const ATTENDANCE_BLOCKER_MESSAGES: Readonly<
  Record<AttendanceBlocker, { title: string; text: string }>
> = {
  APPOINTMENT_NOT_STARTED: {
    title: 'La cita aún no ha comenzado',
    text: 'Podrás registrar si el cliente asistió cuando la cita termine.',
  },
  APPOINTMENT_IN_PROGRESS: {
    title: 'La cita está en curso',
    text: 'Podrás registrar si el cliente asistió cuando la cita termine.',
  },
  APPOINTMENT_END_UNKNOWN: {
    title: 'No se puede confirmar el fin de la cita',
    text: 'La agenda no acredita la hora de término de esta cita, por lo que todavía no se puede registrar el resultado.',
  },
  RESERVATION_CANCELLED: {
    title: 'Reserva cancelada',
    text: 'Una cancelación no es una inasistencia: no corresponde registrar asistencia.',
  },
  PREDICTION_REQUIRED: {
    title: 'Primero se necesita una estimación',
    text: 'Esta cita no tiene una estimación registrada con la cual comparar el resultado.',
  },
  ALREADY_RECORDED: {
    title: 'Resultado ya registrado',
    text: 'La asistencia de esta cita ya fue registrada.',
  },
};

export const RECOVERY_REQUIRES_OVERBOOKING =
  'Primero debe habilitarse el horario para sobreasignación.';

export const COMPARISON_THRESHOLD_NOTE =
  'Umbral provisional de comparación; es distinto de las bandas Alto, Medio y Bajo.';
