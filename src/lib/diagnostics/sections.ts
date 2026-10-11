import type { ApiReason, ApiResult } from '@/lib/api/result';

/**
 * Información técnica para el panel de diagnóstico de desarrollo. Solo contiene campos
 * devueltos por la API o la configuración pública (nunca credenciales ni URLs privadas).
 */
export type DiagnosticValue = string | number | boolean | null | undefined;

export interface DiagnosticItem {
  label: string;
  value: string;
}

export interface DiagnosticSection {
  title: string;
  items: DiagnosticItem[];
}

export interface ScreenContext {
  screen: string;
  feature: string;
  story: string;
  endpoint: string;
}

function formatValue(value: DiagnosticValue): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return String(value);
}

/** Omite los campos ausentes: el diagnóstico solo muestra lo disponible. */
export function diagnosticSection(
  title: string,
  entries: ReadonlyArray<readonly [string, DiagnosticValue]>,
): DiagnosticSection {
  const items = entries.flatMap(([label, value]) => {
    const text = formatValue(value);
    return text === null ? [] : [{ label, value: text }];
  });
  return { title, items };
}

export function screenContextSection(context: ScreenContext): DiagnosticSection {
  return diagnosticSection('Contexto de la pantalla', [
    ['Pantalla', context.screen],
    ['Funcionalidad', context.feature],
    ['Historia', context.story],
    ['Endpoint', context.endpoint],
  ]);
}

export function reasonsSection(title: string, reasons: ApiReason[]): DiagnosticSection {
  return { title, items: reasons.map((reason) => ({ label: reason.code, value: reason.message })) };
}

/** Estado HTTP, código, requestId y motivos de una respuesta, exitosa o fallida. */
export function responseSections(result: ApiResult<unknown>): DiagnosticSection[] {
  if (result.ok) {
    return [
      diagnosticSection('Respuesta técnica', [
        ['Estado HTTP', result.status],
        ['Request ID', result.requestId],
      ]),
    ];
  }
  const { error } = result;
  const fieldErrors = error.fieldErrors.map((item) => ({
    code: item.field,
    message: item.message,
  }));
  return [
    diagnosticSection('Respuesta técnica', [
      ['Estado HTTP', error.status],
      ['Código', error.code],
      ['Tipo de error', error.kind],
      ['Request ID', error.requestId],
      ['Mensaje', error.message],
    ]),
    reasonsSection('Motivos técnicos', [...error.reasons, ...fieldErrors]),
  ];
}
