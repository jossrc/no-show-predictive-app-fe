import { FlaskConical } from 'lucide-react';

/**
 * En modo `mock` todas las pantallas muestran que los datos son de prueba, para que nunca se
 * confundan con respuestas reales del backend.
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
      Modo de prueba: datos sintéticos simulados (FRONTEND_DATA_MODE=mock). No son resultados
      reales.
    </div>
  );
}
