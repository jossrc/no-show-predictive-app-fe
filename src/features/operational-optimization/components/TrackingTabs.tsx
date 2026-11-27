import Link from 'next/link';

import {
  type OperationalQuery,
  TRACKING_VIEWS,
  type TrackingView,
} from '@/features/operational-optimization/model/query';
import { trackingViewHref } from '@/features/operational-optimization/model/urls';
import { cn } from '@/lib/utils';

export const TRACKING_VIEW_LABELS: Readonly<Record<TrackingView, string>> = {
  authorizations: 'Horarios habilitados',
  attendance: 'Asistencia registrada',
  recovery: 'Espacios recuperados',
};

/**
 * Listados persistidos del seguimiento como enlaces (la vista vive en la URL y el servidor
 * consulta solo el listado elegido). Cambiar de vista reinicia su paginación.
 */
export function TrackingTabs({ query }: { query: OperationalQuery }) {
  return (
    <nav aria-label="Vistas del seguimiento operativo" className="border-b px-3 sm:px-5">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {TRACKING_VIEWS.map((view) => {
          const active = view === query.view;
          return (
            <li key={view} className="shrink-0">
              <Link
                href={trackingViewHref(query, view)}
                aria-current={active ? 'page' : undefined}
                scroll={false}
                className={cn(
                  'inline-flex h-10 items-center border-b-2 px-2 text-[13px] font-medium transition-colors',
                  active
                    ? 'border-brand text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {TRACKING_VIEW_LABELS[view]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
