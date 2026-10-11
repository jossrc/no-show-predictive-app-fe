'use client';

import { ErrorState } from '@/components/shared/ErrorState';

export default function WorkspaceError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorState digest={error.digest} onRetry={retry} />;
}
