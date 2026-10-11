import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

import { PresentationProvider } from '@/providers/PresentationProvider';
import { createQueryClient } from '@/providers/QueryProvider';

/**
 * Renderiza con un QueryClient aislado (sin reintentos), como en la aplicación. Por defecto la
 * presentación es la de producción (sin diagnósticos), igual que sin proveedor.
 */
export function renderWithQuery(ui: ReactElement, options: { diagnosticsEnabled?: boolean } = {}) {
  const client = createQueryClient();
  return render(
    <PresentationProvider value={{ diagnosticsEnabled: options.diagnosticsEnabled ?? false }}>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </PresentationProvider>,
  );
}
