'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useState } from 'react';

import { usePresentation } from '@/providers/PresentationProvider';

/**
 * Las consultas interactivas (historial por modo, explicaciones SHAP) devuelven `ApiResult`:
 * los errores funcionales no lanzan excepciones. No hay reintentos ni refetch automáticos;
 * el usuario reintenta de forma explícita.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 60_000,
      },
      mutations: { retry: false },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  // Las herramientas de TanStack solo acompañan al diagnóstico de desarrollo (APP_ENV).
  const { diagnosticsEnabled } = usePresentation();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {diagnosticsEnabled && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
