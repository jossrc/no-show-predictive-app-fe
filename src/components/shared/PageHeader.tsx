import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Contenido sobre el título, p. ej. enlace de regreso. */
  eyebrow?: ReactNode;
  /** Contenido junto al título, p. ej. el estado de la reserva. */
  titleAddon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  titleAddon,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {eyebrow}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-[28px]">
            {title}
          </h1>
          {titleAddon}
        </div>
        {description && (
          <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
