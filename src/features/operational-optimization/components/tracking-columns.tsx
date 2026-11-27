import { EnabledMark } from '@/features/operational-optimization/components/OverbookingMarkBadge';
import type { RecordColumn } from '@/features/operational-optimization/components/ResponsiveRecords';
import type {
  AttendanceRowView,
  AuthorizationRowView,
  RecoveryRowView,
} from '@/features/operational-optimization/model/tracking-view';

/** Columnas de los listados persistidos del «Seguimiento operativo». */

function base<
  T extends { reservationId: string; date: string; time: string; clinicLabel: string },
>(): RecordColumn<T>[] {
  return [
    {
      key: 'reservation',
      header: 'Reserva',
      primary: true,
      cell: (row) => <span className="font-medium tabular-nums">#{row.reservationId}</span>,
    },
    {
      key: 'appointment',
      header: 'Fecha y hora',
      className: 'whitespace-nowrap',
      cell: (row) => (
        <span className="tabular-nums">
          {row.date} · {row.time}
        </span>
      ),
    },
    {
      key: 'clinic',
      header: 'Sede',
      className: 'whitespace-nowrap',
      cell: (row) => row.clinicLabel,
    },
  ];
}

export const AUTHORIZATION_COLUMNS: RecordColumn<AuthorizationRowView>[] = [
  ...base<AuthorizationRowView>(),
  {
    key: 'mark',
    header: 'Riesgo y estado',
    cell: (row) => (
      <span className="flex flex-col items-end gap-1 lg:items-start">
        <EnabledMark label={row.statusLabel} />
        <span className="text-xs text-muted-foreground tabular-nums">{row.estimateText}</span>
      </span>
    ),
  },
  {
    key: 'enabledAt',
    header: 'Habilitado el',
    cell: (row) => <span className="tabular-nums">{row.recordedAt}</span>,
  },
];

export const ATTENDANCE_COLUMNS: RecordColumn<AttendanceRowView>[] = [
  ...base<AttendanceRowView>(),
  {
    key: 'result',
    header: '¿Asistió?',
    cell: (row) => <span className="font-medium">{row.resultLabel}</span>,
  },
  {
    key: 'comparison',
    header: 'Comparación con la estimación',
    cell: (row) =>
      row.comparisons.length > 0 ? (
        <ul className="space-y-0.5 text-[13px]">
          {row.comparisons.map((comparison) => (
            <li key={comparison.modelKey}>{comparison.text}</li>
          ))}
        </ul>
      ) : (
        <span className="text-muted-foreground">Sin comparación</span>
      ),
  },
  {
    key: 'recordedAt',
    header: 'Registrado el',
    cell: (row) => <span className="tabular-nums">{row.recordedAt}</span>,
  },
];

export const RECOVERY_COLUMNS: RecordColumn<RecoveryRowView>[] = [
  ...base<RecoveryRowView>(),
  {
    key: 'result',
    header: '¿Espacio recuperado?',
    cell: (row) => <span className="font-medium">{row.resultLabel}</span>,
  },
  {
    key: 'recordedAt',
    header: 'Registrado el',
    cell: (row) => <span className="tabular-nums">{row.recordedAt}</span>,
  },
];
