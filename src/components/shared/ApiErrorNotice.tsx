import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { ReasonList } from '@/components/shared/ReasonList';
import { RequestIdNote } from '@/components/shared/RequestIdNote';
import type { ApiError } from '@/lib/api/result';
import { describeApiError } from '@/lib/errors/error-catalog';
import { cn } from '@/lib/utils';

interface ApiErrorNoticeProps {
  error: ApiError;
  /** Sustituye el título del catálogo cuando la sección necesita un mensaje propio. */
  title?: string;
  description?: string;
  /** Acción de recuperación (reintento manual, volver a la primera página…). */
  action?: ReactNode;
  className?: string;
}

/**
 * Error localizado dentro de la página o sección. Muestra un mensaje en español, motivos
 * técnicos en un desplegable y el `requestId`; nunca credenciales ni stacks.
 */
export function ApiErrorNotice({
  error,
  title,
  description,
  action,
  className,
}: ApiErrorNoticeProps) {
  const presentation = describeApiError(error);
  const fieldErrors = error.fieldErrors.map((item) => ({
    code: item.field,
    message: item.message,
  }));

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-sm',
        className,
      )}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">{title ?? presentation.title}</p>
          <p className="text-pretty text-muted-foreground">
            {description ?? presentation.description}
          </p>
        </div>
        <ReasonList reasons={[...error.reasons, ...fieldErrors]} summary="Detalles técnicos" />
        <RequestIdNote requestId={error.requestId} />
        {action && <div className="flex flex-wrap gap-2 pt-1">{action}</div>}
      </div>
    </div>
  );
}
