import type { ClientHistory, HistoricalAsOf } from '@/features/client-history/api/contract';
import type { ApiResult } from '@/lib/api/result';
import { formatLimaDate, formatLimaDateTime } from '@/lib/dates/lima';
import {
  type DiagnosticSection,
  diagnosticSection,
  responseSections,
  screenContextSection,
} from '@/lib/diagnostics/sections';
import { formatRate } from '@/lib/format/percentage';

export const HISTORY_MODE_LABELS: Readonly<Record<HistoricalAsOf, string>> = {
  booking_creation: 'Al reservar',
  current_known: 'Información actual',
};

export function describeHistoryMode(mode: HistoricalAsOf, cutoffText: string): string {
  return mode === 'booking_creation'
    ? `Información conocida al crear la reserva (${cutoffText}).`
    : `Información conocida hasta el ${cutoffText}`;
}

/**
 * Aclaraciones del backend en lenguaje sencillo. No cambian su significado: solo su redacción.
 * Los códigos sin traducción se resumen en una nota genérica y se detallan en el diagnóstico.
 */
const WARNING_TEXTS: Readonly<Record<string, string>> = {
  CANCELLATIONS_EXCLUDED: 'Las cancelaciones no se cuentan como inasistencias.',
  ATTENDANCE_KNOWN_AT_SESSION_CLOSE:
    'La asistencia se registra al cerrar la atención, por lo que la información puede actualizarse después.',
  NO_SHOW_CANDIDATE_INCLUDES_SYSTEM_TRACKED_RECORDS:
    'Algunas inasistencias se identifican con base en los registros disponibles y no equivalen necesariamente a ausencias confirmadas.',
  SOURCE_AS_OF_LAST_INGESTION: 'Los datos dependen de la última información sincronizada.',
  CURRENT_KNOWN_DOES_NOT_FEED_ORIGINAL_SCORE:
    'El historial actual no modifica una predicción realizada anteriormente.',
};

export const RATE_SCOPE_TEXT =
  'La tasa histórica describe citas anteriores; no es la estimación de esta cita.';
const UNKNOWN_WARNING_TEXT = 'Existen aclaraciones adicionales del sistema sobre estos datos.';

export const NO_HISTORY_RATE_TEXT = 'Sin datos suficientes';

export function describeHistoryWarnings(codes: string[]): string[] {
  const known = codes.flatMap((code) => (WARNING_TEXTS[code] ? [WARNING_TEXTS[code]] : []));
  const hasUnknown = codes.some((code) => !WARNING_TEXTS[code]);
  return [...known, ...(hasUnknown ? [UNKNOWN_WARNING_TEXT] : []), RATE_SCOPE_TEXT];
}

export interface HistoryView {
  attended: number;
  noShow: number;
  resolvedTotal: number;
  /** null → «Sin datos suficientes»; nunca se convierte en 0 %. */
  rateText: string | null;
  lastAttendedText: string | null;
  lastNoShowText: string | null;
  modeText: string;
  considerations: string[];
}

export function toHistoryView(history: ClientHistory): HistoryView {
  return {
    attended: history.previousAttended,
    noShow: history.previousNoShow,
    resolvedTotal: history.resolvedTotal,
    rateText: history.noShowRate === null ? null : formatRate(history.noShowRate),
    lastAttendedText: history.lastAttendedAt ? formatLimaDate(history.lastAttendedAt) : null,
    lastNoShowText: history.lastNoShowAt ? formatLimaDate(history.lastNoShowAt) : null,
    modeText: describeHistoryMode(history.historicalAsOf, formatLimaDateTime(history.cutoffAt)),
    considerations: describeHistoryWarnings(history.warnings),
  };
}

/** Diagnóstico de desarrollo de HU-06 para el modo consultado. */
export function historyDiagnostics(
  mode: HistoricalAsOf,
  result: ApiResult<ClientHistory> | undefined,
): DiagnosticSection[] {
  const history = result?.ok ? result.data : null;
  return [
    screenContextSection({
      screen: 'Detalle de reserva',
      feature: 'Historial del cliente',
      story: 'HU-06',
      endpoint: `GET /api/v1/reservations/:reservationId/client-history?historicalAsOf=${mode}`,
    }),
    ...(result ? responseSections(result) : []),
    diagnosticSection('Corte temporal', [
      ['historicalAsOf', history?.historicalAsOf],
      ['cutoffAt', history?.cutoffAt],
      ['cutoffSemantics', history?.cutoffSemantics],
      ['historySemantics', history?.historySemantics],
      ['noShowRate', history ? String(history.noShowRate) : null],
      ['warnings', history?.warnings.join(', ')],
    ]),
  ];
}
