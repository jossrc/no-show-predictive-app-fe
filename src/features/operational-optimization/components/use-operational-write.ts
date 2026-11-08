'use client';

import { useRef, useState, useTransition } from 'react';

import type { ApiResult } from '@/lib/api/result';
import { networkFailure } from '@/lib/errors/api-errors';

/**
 * Ejecuta una Server Action de escritura una sola vez a la vez (bloquea el doble clic) y conserva
 * el resultado hasta el siguiente envío. Nunca reintenta automáticamente.
 */
export function useOperationalWrite<T>() {
  const [result, setResult] = useState<ApiResult<T> | null>(null);
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);

  const submit = (
    run: () => Promise<ApiResult<T>>,
    onSettled?: (outcome: ApiResult<T>) => void,
  ) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setResult(null);
    startTransition(async () => {
      let outcome: ApiResult<T>;
      try {
        outcome = await run();
      } catch {
        // La acción no respondió: el resultado del POST es desconocido.
        outcome = networkFailure();
      } finally {
        inFlight.current = false;
      }
      startTransition(() => {
        setResult(outcome);
        onSettled?.(outcome);
      });
    });
  };

  return { result, pending, submit, reset: () => setResult(null) };
}

export type OperationalWrite<T> = ReturnType<typeof useOperationalWrite<T>>;
