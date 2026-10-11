'use client';

import {
  DiagnosticsSheet,
  type DiagnosticsSheetProps,
} from '@/components/diagnostics/DiagnosticsSheet';
import { usePresentation } from '@/providers/PresentationProvider';

/** Variante para componentes cliente: usa la decisión distribuida por `PresentationProvider`. */
export function ClientDiagnostics(props: DiagnosticsSheetProps) {
  const { diagnosticsEnabled } = usePresentation();
  if (!diagnosticsEnabled) return null;
  return <DiagnosticsSheet {...props} />;
}
