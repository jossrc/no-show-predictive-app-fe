import type { ReactNode } from 'react';

import { AppHeader } from '@/components/layout/AppHeader';

interface AppShellProps {
  children: ReactNode;
  /** Herramientas técnicas en la cabecera (solo desarrollo). */
  toolsSlot?: ReactNode;
  /** Etiqueta visible del entorno de presentación (solo desarrollo). */
  environmentLabel?: string | null;
  /** Aviso global (p. ej. modo de datos de prueba). */
  bannerSlot?: ReactNode;
}

export function AppShell({ children, toolsSlot, environmentLabel, bannerSlot }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only fixed top-2 left-2 z-50 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only"
      >
        Ir al contenido
      </a>
      {bannerSlot}
      <AppHeader toolsSlot={toolsSlot} environmentLabel={environmentLabel} />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-16 outline-none sm:px-6 sm:pt-8 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
}
