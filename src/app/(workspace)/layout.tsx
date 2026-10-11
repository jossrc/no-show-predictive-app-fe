import { type ReactNode, Suspense } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { DataModeBanner } from '@/components/layout/DataModeBanner';
import { ServiceDiagnostics } from '@/features/prediction-models/components/ServiceDiagnostics';
import { getPresentationConfig } from '@/lib/config/presentation';
import { getPublicDataMode } from '@/lib/config/server';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const presentation = getPresentationConfig();
  return (
    <AppShell
      bannerSlot={<DataModeBanner mode={getPublicDataMode()} />}
      environmentLabel={presentation.environmentLabel}
      toolsSlot={
        presentation.diagnosticsEnabled && (
          <Suspense fallback={null}>
            <ServiceDiagnostics />
          </Suspense>
        )
      }
    >
      {children}
    </AppShell>
  );
}
