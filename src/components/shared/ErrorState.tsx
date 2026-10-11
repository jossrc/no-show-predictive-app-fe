'use client';

import { CircleAlert } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type ErrorStateProps = { title?: string; description?: string; onRetry?: () => void };

export function ErrorState({
  title = 'No se pudo cargar el contenido',
  description = 'Intenta nuevamente en unos momentos.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
