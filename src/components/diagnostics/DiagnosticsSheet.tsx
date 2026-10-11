'use client';

import { Stethoscope } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { DiagnosticSection } from '@/lib/diagnostics/sections';

export interface DiagnosticsSheetProps {
  /** Funcionalidad diagnosticada, p. ej. «Estimación de inasistencia». */
  subject: string;
  sections: DiagnosticSection[];
  /** `icon`: botón discreto en cabeceras de sección; `button`: barra superior; `link`: avisos. */
  variant?: 'icon' | 'button' | 'link';
}

/** Elemento del disparador (no un componente) para que `SheetTrigger asChild` le transfiera props. */
function triggerElement(subject: string, variant: 'icon' | 'button' | 'link') {
  if (variant === 'button') {
    return (
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <Stethoscope aria-hidden="true" />
        <span className="hidden sm:inline">Diagnóstico</span>
        <span className="sr-only sm:hidden">Diagnóstico</span>
      </Button>
    );
  }
  if (variant === 'link') {
    return (
      <Button variant="link" size="xs" className="h-auto px-0 text-xs">
        Ver diagnóstico técnico
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground"
      aria-label={`Diagnóstico técnico: ${subject}`}
      title="Diagnóstico técnico"
    >
      <Stethoscope aria-hidden="true" />
    </Button>
  );
}

/**
 * Panel lateral con información técnica (solo desarrollo). Está oculto hasta que el usuario lo
 * abre y no realiza consultas propias: presenta datos ya obtenidos por la pantalla.
 */
export function DiagnosticsSheet({ subject, sections, variant = 'icon' }: DiagnosticsSheetProps) {
  const visible = sections.filter((section) => section.items.length > 0);
  return (
    <Sheet>
      <SheetTrigger asChild>{triggerElement(subject, variant)}</SheetTrigger>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Diagnóstico técnico</SheetTitle>
          <SheetDescription>{subject} · visible solo en desarrollo</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay información técnica disponible.</p>
          )}
          {visible.map((section) => (
            <section key={section.title} className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">{section.title}</h3>
              <dl className="divide-y rounded-lg border bg-surface-subtle text-xs">
                {section.items.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 px-3 py-2"
                  >
                    <dt className="break-all text-muted-foreground">{item.label}</dt>
                    <dd className="font-mono break-all text-foreground">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
