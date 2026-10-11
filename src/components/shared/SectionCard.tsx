import type { ReactNode } from 'react';
import { useId } from 'react';

import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  description?: ReactNode;
  /** Etiqueta discreta junto al título. */
  meta?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Sección con título accesible (`aria-labelledby`) y superficie blanca consistente. */
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
      className={cn('rounded-xl border bg-card text-card-foreground shadow-surface', className)}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={headingId} className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            {meta}
          </div>
          {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="-mt-1 flex shrink-0 items-center gap-1.5">{actions}</div>}
      </div>
      <div className="px-5 pt-4 pb-5">{children}</div>
      {footer && (
        <div className="rounded-b-xl border-t bg-surface-subtle px-5 py-3 text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </section>
  );
}
