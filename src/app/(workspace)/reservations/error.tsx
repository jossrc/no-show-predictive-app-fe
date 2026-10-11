'use client';

import { ErrorState } from '@/components/shared/ErrorState';

export default function ReservationsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      title="No se pudo mostrar el listado de reservas"
      digest={error.digest}
      onRetry={retry}
    />
  );
}
