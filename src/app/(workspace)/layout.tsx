import { type ReactNode, Suspense } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { DataModeBanner } from '@/components/layout/DataModeBanner';
import { MlServiceStatus } from '@/features/prediction-models/components/MlServiceStatus';
import { getPublicDataMode } from '@/lib/config/server';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell
      bannerSlot={<DataModeBanner mode={getPublicDataMode()} />}
      statusSlot={
        <Suspense fallback={null}>
          <MlServiceStatus />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
