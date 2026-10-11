'use client';

import { CircleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ErrorStateProps = {
  title?: string;
  description?: string;
  digest?: string;
  onRetry?: () => void;
};

/** Error inesperado de renderizado (límite `error.tsx`). Los errores de API se muestran en línea. */
export function ErrorState({
  title = 'No se pudo mostrar esta vista',
  description = 'Ocurrió un error inesperado. Puedes reintentar; si persiste, revisa el servidor de desarrollo.',
  digest,
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-xl border bg-card px-5 py-6 shadow-xs">
      <div className="flex gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="space-y-2">
          <h1 className="text-base font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          {digest && (
            <p className="text-[11px] text-muted-foreground">
              Referencia: <code className="font-mono">{digest}</code>
            </p>
          )}
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
