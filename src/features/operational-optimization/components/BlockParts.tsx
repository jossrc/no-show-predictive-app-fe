import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { RefreshButton } from '@/components/shared/RefreshButton';
import { Button } from '@/components/ui/button';
import { operationalErrorText } from '@/features/operational-optimization/model/errors';
import { formatReservationLabel } from '@/features/reservations/model/labels';
import type { ApiError } from '@/lib/api/result';
import type { DiagnosticSection } from '@/lib/diagnostics/sections';
import { describeApiError } from '@/lib/errors/error-catalog';

/** Enlace único al detalle: el nombre accesible incluye el identificador de la reserva. */
export function RecordDetailLink({ href, reservationId }: { href: string; reservationId: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
      <Link href={href} aria-label={`Ver detalle de ${formatReservationLabel(reservationId)}`}>
        Ver detalle
        <ChevronRight aria-hidden="true" />
      </Link>
    </Button>
  );
}

interface BlockErrorProps {
  error: ApiError;
  /** Texto del recurso (p. ej. «las reservas con alto riesgo»). */
  subject: string;
  firstPageHref: string;
  withoutClinicHref: string | null;
  diagnostics: DiagnosticSection[];
}

/**
 * Error localizado de un bloque: nunca se degrada a una lista vacía. Los errores de filtro
 * (422) ofrecen su propia corrección; el resto permite reintentar la lectura.
 */
export function BlockError({
  error,
  subject,
  firstPageHref,
  withoutClinicHref,
  diagnostics,
}: BlockErrorProps) {
  const link = (href: string, label: string) => (
    <Button asChild size="sm" variant="outline">
      <Link href={href}>{label}</Link>
    </Button>
  );
  const common = { error, diagnostics, className: 'm-4' };
  if (error.code === 'INVALID_CURSOR') {
    return <ApiErrorNotice {...common} action={link(firstPageHref, 'Ir a la primera página')} />;
  }
  if (error.code === 'UNKNOWN_CLINIC' && withoutClinicHref) {
    return <ApiErrorNotice {...common} action={link(withoutClinicHref, 'Quitar filtro de sede')} />;
  }
  if (error.code === 'INVALID_PERIOD') return <ApiErrorNotice {...common} />;
  const { retryable } = describeApiError(error);
  const texts = operationalErrorText(error);
  return (
    <ApiErrorNotice
      {...common}
      title={texts.title ?? `No pudimos cargar ${subject}`}
      description={
        texts.description ?? (retryable ? 'Intenta actualizar la información.' : undefined)
      }
      action={retryable ? <RefreshButton label="Reintentar" size="sm" /> : null}
    />
  );
}
