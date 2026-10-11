'use client';

import { CircleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { usePresentation } from '@/providers/PresentationProvider';

type ErrorStateProps = {
  title?: string;
  description?: string;
  digest?: string;
  onRetry?: () => void;
};

/** Error inesperado de renderizado (límite `error.tsx`). Los errores de API se muestran en línea. */
export function ErrorState({
  title = 'No pudimos mostrar esta vista',
  description = 'Ocurrió un error inesperado. Intenta nuevamente.',
  digest,
  onRetry,
}: ErrorStateProps) {
  const { diagnosticsEnabled } = usePresentation();
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-xl border bg-card px-6 py-6 shadow-surface"
    >
      <div className="flex gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="space-y-2">
          <h1 className="text-base font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          {diagnosticsEnabled && digest && (
            <p className="text-xs text-muted-foreground">
              Referencia técnica: <code className="font-mono">{digest}</code>
            </p>
          )}
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
              Reintentar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
