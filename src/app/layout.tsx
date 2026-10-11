import './globals.css';

import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '@/providers/AppProviders';

export const metadata: Metadata = {
  title: { default: 'Agenda Predictiva', template: '%s · Agenda Predictiva' },
  description:
    'Sistema web predictivo de inasistencias para una empresa de estética y cuidado personal.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
