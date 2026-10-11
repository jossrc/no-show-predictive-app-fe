import { DescriptionList } from '@/components/shared/DescriptionList';
import { RequestIdNote } from '@/components/shared/RequestIdNote';
import type { ClientHistory } from '@/features/client-history/api/contract';
import {
  HISTORY_MODE_DESCRIPTIONS,
  NO_HISTORY_RATE_TEXT,
  toHistoryView,
} from '@/features/client-history/model/history-view';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-surface-subtle px-3 py-2.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value}</dd>
      {hint && <dd className="text-[11px] text-muted-foreground">{hint}</dd>}
    </div>
  );
}

/** Conteos y tasa histórica (proxy NO_SHOW_CANDIDATE) con su corte temporal explícito. */
export function HistorySummary({
  history,
  requestId,
}: {
  history: ClientHistory;
  requestId: string | null;
}) {
  const view = toHistoryView(history);
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {HISTORY_MODE_DESCRIPTIONS[history.historicalAsOf]}
      </p>
      <dl className="grid grid-cols-2 gap-2">
        <Stat label="Asistencias previas" value={String(view.attended)} />
        <Stat label="Inasistencias candidatas" value={String(view.noShow)} />
        <Stat label="Total resuelto" value={String(view.resolvedTotal)} />
        <Stat
          label="Tasa histórica"
          value={view.rateText ?? '—'}
          hint={view.rateText === null ? NO_HISTORY_RATE_TEXT : undefined}
        />
      </dl>
      <p className="text-[11px] text-muted-foreground">
        La tasa histórica describe citas previas resueltas; no es la probabilidad predictiva de esta
        cita.
      </p>
      <DescriptionList
        className="text-xs"
        items={[
          { term: 'Última asistencia', value: view.lastAttendedText ?? 'Sin registros' },
          { term: 'Última inasistencia candidata', value: view.lastNoShowText ?? 'Sin registros' },
          { term: 'Fecha de corte', value: view.cutoffText },
          {
            term: 'Criterio de corte',
            value: <code className="font-mono font-normal">{history.cutoffSemantics}</code>,
          },
        ]}
      />
      {view.warnings.length > 0 && (
        <ul className="space-y-1.5 border-l-2 pl-3 text-[11px] text-muted-foreground">
          {view.warnings.map((warning) => (
            <li key={warning.code}>{warning.text}</li>
          ))}
        </ul>
      )}
      <RequestIdNote requestId={requestId} />
    </div>
  );
}
