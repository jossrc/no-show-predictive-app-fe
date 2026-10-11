'use client';

import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { ClientDiagnostics } from '@/components/diagnostics/ClientDiagnostics';
import type { ApiError } from '@/lib/api/result';
import { type DiagnosticSection, responseSections } from '@/lib/diagnostics/sections';
import { describeApiError } from '@/lib/errors/error-catalog';
import { cn } from '@/lib/utils';

interface ApiErrorNoticeProps {
  error: ApiError;
  /** Sustituye el título del catálogo cuando la sección necesita un mensaje propio. */
  title?: string;
  description?: string;
  /** Acción de recuperación (reintento manual, volver a la primera página…). */
  action?: ReactNode;
  /** Contexto técnico adicional para el diagnóstico de desarrollo. */
  diagnostics?: DiagnosticSection[];
  className?: string;
}

/**
 * Error localizado junto a la funcionalidad afectada, en lenguaje sencillo. Los códigos, el
 * estado HTTP y el `requestId` solo se consultan en el diagnóstico de desarrollo.
 */
export function ApiErrorNotice({
  error,
  title,
  description,
  action,
  diagnostics = [],
  className,
}: ApiErrorNoticeProps) {
  const presentation = describeApiError(error);
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-lg border border-destructive/20 bg-destructive/[0.04] px-4 py-3.5 text-sm',
        className,
      )}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">{title ?? presentation.title}</p>
          <p className="text-pretty text-muted-foreground">
            {description ?? presentation.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 empty:hidden">
          {action}
          <ClientDiagnostics
            subject={title ?? presentation.title}
            sections={[...diagnostics, ...responseSections({ ok: false, error })]}
            variant="link"
          />
        </div>
      </div>
    </div>
  );
}
