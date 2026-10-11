import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '@/providers/AppProviders';

export const metadata: Metadata = {
  title: { default: 'Agenda Predictiva', template: '%s | Agenda Predictiva' },
  description: 'Sistema predictivo de inasistencias para estética y cuidado personal.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
