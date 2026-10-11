import {
  DiagnosticsSheet,
  type DiagnosticsSheetProps,
} from '@/components/diagnostics/DiagnosticsSheet';
import { diagnosticsEnabled } from '@/lib/config/presentation';

/**
 * Acceso al diagnóstico técnico desde componentes de servidor. Se decide en el servidor: en
 * producción no se renderiza ni se envía al navegador ninguna información técnica.
 */
export function DevelopmentDiagnostics(props: DiagnosticsSheetProps) {
  if (!diagnosticsEnabled()) return null;
  return <DiagnosticsSheet {...props} />;
}
