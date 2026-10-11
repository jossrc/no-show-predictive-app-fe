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
    <ErrorState title="No pudimos mostrar las reservas" digest={error.digest} onRetry={retry} />
  );
}
