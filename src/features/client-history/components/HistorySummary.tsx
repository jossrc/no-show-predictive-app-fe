import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { DescriptionList } from '@/components/shared/DescriptionList';
import type { ClientHistory } from '@/features/client-history/api/contract';
import { NO_HISTORY_RATE_TEXT, toHistoryView } from '@/features/client-history/model/history-view';

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex min-w-0 flex-col px-3 py-3">
      <dt className="text-xs leading-snug text-muted-foreground">{label}</dt>
      <dd className="mt-auto pt-1">
        {value === null ? (
          <span className="text-[13px] font-medium text-muted-foreground">
            {NO_HISTORY_RATE_TEXT}
          </span>
        ) : (
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        )}
      </dd>
    </div>
  );
}

/** Aclaraciones agrupadas en un desplegable accesible (no ocupan la vista principal). */
function HowItIsCalculated({ considerations }: { considerations: string[] }) {
  return (
    <details className="group rounded-lg border px-3.5 py-2.5 text-[13px]">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-sm font-medium text-foreground/80 hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-4 transition-transform group-open:rotate-90"
        />
        Cómo se calcula esta información
      </summary>
      <ul className="mt-2 list-disc space-y-1.5 pl-9 text-muted-foreground">
        {considerations.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </details>
  );
}

/** Asistencias, posibles inasistencias y tasa histórica, con el total como dato secundario. */
export function HistorySummary({
  history,
  diagnostics,
}: {
  history: ClientHistory;
  /** Acceso al diagnóstico de desarrollo (ausente en producción). */
  diagnostics?: ReactNode;
}) {
  const view = toHistoryView(history);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">{view.modeText}</p>
        <div className="-mt-1.5 -mr-1.5 shrink-0 empty:hidden">{diagnostics}</div>
      </div>
      <dl className="grid grid-cols-3 divide-x rounded-lg border bg-surface-subtle">
        <Stat label="Asistencias" value={String(view.attended)} />
        <Stat label="Posibles inasistencias" value={String(view.noShow)} />
        <Stat label="Tasa histórica" value={view.rateText} />
      </dl>
      <DescriptionList
        items={[
          { term: 'Total de citas resueltas', value: String(view.resolvedTotal) },
          { term: 'Última asistencia', value: view.lastAttendedText ?? 'Sin registros' },
          { term: 'Última posible inasistencia', value: view.lastNoShowText ?? 'Sin registros' },
        ]}
      />
      <HowItIsCalculated considerations={view.considerations} />
    </div>
  );
}
