import { type ReactNode, useId } from 'react';

interface Props {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Bloque de la pantalla operativa con título accesible y contenido a sangre (tablas y tarjetas),
 * con la misma superficie que el listado de reservas.
 */
export function OperationalBlock({ title, description, actions, children }: Props) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-surface"
    >
      <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0 space-y-1">
          <h2 id={headingId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-[13px] text-pretty text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="-mt-1 flex shrink-0 items-center gap-1.5">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
