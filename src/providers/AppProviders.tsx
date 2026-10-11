'use client';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PresentationProvider, type PresentationState } from '@/providers/PresentationProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

export function AppProviders({
  presentation,
  children,
}: {
  presentation: PresentationState;
  children: ReactNode;
}) {
  return (
    <PresentationProvider value={presentation}>
      <ThemeProvider>
        <NuqsAdapter>
          <QueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </QueryProvider>
          <Toaster richColors closeButton />
        </NuqsAdapter>
      </ThemeProvider>
    </PresentationProvider>
  );
}
