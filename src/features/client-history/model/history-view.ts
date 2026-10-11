import type { ClientHistory, HistoricalAsOf } from '@/features/client-history/api/contract';
import { formatLimaDateTime } from '@/lib/dates/lima';
import { formatRate } from '@/lib/format/percentage';

export const HISTORY_MODE_LABELS: Readonly<Record<HistoricalAsOf, string>> = {
  booking_creation: 'Al crear la reserva',
  current_known: 'Conocido actualmente',
};

export const HISTORY_MODE_DESCRIPTIONS: Readonly<Record<HistoricalAsOf, string>> = {
  booking_creation:
    'Historial conocido antes de crear la reserva: el mismo corte temporal que utiliza la predicción.',
  current_known:
    'Historial conocido hasta el corte de esta consulta. Es informativo y no corresponde al historial usado por la predicción original.',
};

/**
 * Traducciones de los avisos semánticos del backend. No cambian su significado; un código
 * desconocido se muestra literalmente para no ocultar información.
 */
const WARNING_TEXTS: Readonly<Record<string, string>> = {
  CANCELLATIONS_EXCLUDED: 'Las cancelaciones no se cuentan como inasistencias.',
  ATTENDANCE_KNOWN_AT_SESSION_CLOSE:
    'La asistencia se conoce al cerrar la sesión de atención, que puede registrarse con retraso.',
  NO_SHOW_CANDIDATE_INCLUDES_SYSTEM_TRACKED_RECORDS:
    'Las inasistencias son candidatas (etiqueta proxy) e incluyen registros marcados por el sistema; no son ausencias confirmadas.',
  SOURCE_AS_OF_LAST_INGESTION: 'Los datos corresponden a la última ingesta de la fuente.',
  CURRENT_KNOWN_DOES_NOT_FEED_ORIGINAL_SCORE:
    'Este historial actual no alimenta ni modifica el score original de la reserva.',
};

export function describeHistoryWarning(code: string): string {
  return WARNING_TEXTS[code] ?? code;
}

export const NO_HISTORY_RATE_TEXT = 'Sin historial suficiente';

export interface HistoryView {
  attended: number;
  noShow: number;
  resolvedTotal: number;
  /** null → «Sin historial suficiente»; nunca se convierte en 0 %. */
  rateText: string | null;
  lastAttendedText: string | null;
  lastNoShowText: string | null;
  cutoffText: string;
  warnings: { code: string; text: string }[];
}

export function toHistoryView(history: ClientHistory): HistoryView {
  return {
    attended: history.previousAttended,
    noShow: history.previousNoShow,
    resolvedTotal: history.resolvedTotal,
    rateText: history.noShowRate === null ? null : formatRate(history.noShowRate),
    lastAttendedText: history.lastAttendedAt ? formatLimaDateTime(history.lastAttendedAt) : null,
    lastNoShowText: history.lastNoShowAt ? formatLimaDateTime(history.lastNoShowAt) : null,
    cutoffText: formatLimaDateTime(history.cutoffAt),
    warnings: history.warnings.map((code) => ({ code, text: describeHistoryWarning(code) })),
  };
}
