import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

import { createQueryClient } from '@/providers/QueryProvider';

/** Renderiza con un QueryClient aislado (sin reintentos), como en la aplicación. */
export function renderWithQuery(ui: ReactElement) {
  const client = createQueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}
