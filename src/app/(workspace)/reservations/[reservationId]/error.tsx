'use client';

import { ErrorState } from '@/components/shared/ErrorState';

export default function ReservationDetailError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      title="No pudimos mostrar el detalle de la reserva"
      digest={error.digest}
      onRetry={retry}
    />
  );
}
