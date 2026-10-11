import type { ReactNode } from 'react';

import { AppHeader } from '@/components/layout/AppHeader';

interface AppShellProps {
  children: ReactNode;
  /** Indicador discreto de servicios en la cabecera. */
  statusSlot?: ReactNode;
  /** Aviso global (p. ej. modo de datos de prueba). */
  bannerSlot?: ReactNode;
}

export function AppShell({ children, statusSlot, bannerSlot }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only fixed top-2 left-2 z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only"
      >
        Ir al contenido
      </a>
      {bannerSlot}
      <AppHeader statusSlot={statusSlot} />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-12 outline-none sm:px-6 sm:pt-8 lg:px-8"
      >
        {children}
      </main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>Agenda Predictiva · Sprint 01 · Core predictivo</span>
          <span>Estimaciones exploratorias no validadas · Horario de Lima (America/Lima)</span>
        </div>
      </footer>
    </div>
  );
}
