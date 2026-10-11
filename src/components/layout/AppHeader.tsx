import { CalendarCheck2 } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { MainNavigation } from '@/components/layout/MainNavigation';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

interface AppHeaderProps {
  /** Herramientas técnicas de desarrollo; ausentes en producción. */
  toolsSlot?: ReactNode;
  /** Etiqueta del entorno (p. ej. «Desarrollo»); null en producción. */
  environmentLabel?: string | null;
}

function BrandMark() {
  return (
    <span className="relative flex size-8 items-center justify-center rounded-[9px] bg-brand text-white shadow-xs">
      <CalendarCheck2 aria-hidden="true" className="size-4" />
      <span
        aria-hidden="true"
        className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-brand-accent ring-2 ring-card"
      />
    </span>
  );
}

export function AppHeader({ toolsSlot, environmentLabel }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6 lg:px-8">
        <Link href="/reservations" className="flex shrink-0 items-center gap-2.5 rounded-lg">
          <BrandMark />
          <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">
            Agenda Predictiva
          </span>
          <span className="sr-only sm:hidden">Agenda Predictiva</span>
        </Link>
        <MainNavigation />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {environmentLabel && (
            <span className="hidden h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs text-muted-foreground sm:inline-flex">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-accent" />
              {environmentLabel}
            </span>
          )}
          {toolsSlot}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
