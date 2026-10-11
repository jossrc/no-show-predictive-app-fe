import { ChevronRight } from 'lucide-react';

import type { ApiReason } from '@/lib/api/result';

interface ReasonListProps {
  reasons: ApiReason[];
  summary?: string;
  defaultOpen?: boolean;
}

/** Motivos tipados del backend en un desplegable nativo (accesible por teclado). */
export function ReasonList({
  reasons,
  summary = 'Ver motivos',
  defaultOpen = false,
}: ReasonListProps) {
  if (reasons.length === 0) return null;
  return (
    <details className="group text-xs" open={defaultOpen}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-sm font-medium text-foreground/80 hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 transition-transform group-open:rotate-90"
        />
        {summary} ({reasons.length})
      </summary>
      <ul className="mt-2 space-y-1.5 border-l pl-3">
        {reasons.map((reason) => (
          <li key={reason.code} className="text-muted-foreground">
            <span className="text-foreground/90">{reason.message}</span>
            <code className="ml-1.5 font-mono text-[10px] break-all text-muted-foreground">
              {reason.code}
            </code>
          </li>
        ))}
      </ul>
    </details>
  );
}
