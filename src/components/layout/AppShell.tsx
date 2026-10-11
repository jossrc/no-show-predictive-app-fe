import type { ReactNode } from 'react';

import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only"
      >
        Ir al contenido
      </a>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-sidebar md:block">
        <AppSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 p-5 sm:p-8 lg:p-12"
        >
          {children}
        </main>
        <footer className="px-5 py-6 text-xs text-muted-foreground sm:px-8">
          Agenda Predictiva · Fundación del frontend · Zona horaria: Lima
        </footer>
      </div>
    </div>
  );
}
