import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import { getPresentationConfig } from '@/lib/config/presentation';
import { AppProviders } from '@/providers/AppProviders';

// Inter variable con eje óptico: los títulos grandes usan automáticamente el corte Display.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', axes: ['opsz'] });

export const metadata: Metadata = {
  title: { default: 'Agenda Predictiva', template: '%s · Agenda Predictiva' },
  description: 'Consulta y seguimiento de citas programadas.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const { diagnosticsEnabled } = getPresentationConfig();
  return (
    <html lang="es" suppressHydrationWarning className={inter.variable}>
      <body className="bg-background font-sans text-foreground antialiased">
        <AppProviders presentation={{ diagnosticsEnabled }}>{children}</AppProviders>
      </body>
    </html>
  );
}
