'use client';

import { ErrorState } from '@/components/shared/ErrorState';

export default function OperationalOptimizationError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      title="No pudimos mostrar la optimización operativa"
      digest={error.digest}
      onRetry={retry}
    />
  );
}
