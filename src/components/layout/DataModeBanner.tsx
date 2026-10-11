import { FlaskConical } from 'lucide-react';

/**
 * En modo de prueba todas las pantallas indican que los datos son simulados, para que nunca se
 * confundan con información real.
 */
export function DataModeBanner({ mode }: { mode: 'live' | 'mock' | 'misconfigured' }) {
  if (mode !== 'mock') return null;
  return (
    <div
      role="note"
      className="border-b border-warning-border bg-warning-surface px-4 py-1.5 text-center text-xs text-foreground"
    >
      <FlaskConical
        aria-hidden="true"
        className="mr-1.5 inline size-3.5 align-[-2px] text-warning"
      />
      Modo de prueba: los datos son simulados. No son resultados reales.
    </div>
  );
}
