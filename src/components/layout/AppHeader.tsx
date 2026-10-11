import { CalendarClock } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { MainNavigation } from '@/components/layout/MainNavigation';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function AppHeader({ statusSlot }: { statusSlot?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Link href="/reservations" className="flex shrink-0 items-center gap-2.5 rounded-md">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CalendarClock aria-hidden="true" className="size-4" />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            Agenda Predictiva
          </span>
          <span className="sr-only sm:hidden">Agenda Predictiva</span>
        </Link>
        <MainNavigation />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {statusSlot}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
