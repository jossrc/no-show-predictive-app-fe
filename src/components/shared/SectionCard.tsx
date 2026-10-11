import type { ReactNode } from 'react';
import { useId } from 'react';

import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  description?: ReactNode;
  /** Etiqueta discreta junto al título (p. ej. «Exploratoria»). */
  meta?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Sección con título accesible (`aria-labelledby`) y superficie consistente. */
export function SectionCard({
  title,
  description,
  meta,
  actions,
  footer,
  className,
  children,
}: SectionCardProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn('rounded-xl border bg-card text-card-foreground shadow-xs', className)}
    >
      <div className="flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={headingId} className="text-sm font-semibold tracking-tight">
              {title}
            </h2>
            {meta}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
      {footer && (
        <div className="rounded-b-xl border-t bg-surface-subtle px-4 py-3 text-xs text-muted-foreground sm:px-5">
          {footer}
        </div>
      )}
    </section>
  );
}
