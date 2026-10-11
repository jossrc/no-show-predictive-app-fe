import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getClientHistory } from '@/features/client-history/api/history.server';
import { ClientHistorySection } from '@/features/client-history/components/ClientHistorySection';
import { getModelCatalog } from '@/features/prediction-models/api/models.server';
import { getReservationRisk } from '@/features/reservation-risk/api/risk.server';
import { RiskFactorsSection } from '@/features/reservation-risk/components/RiskFactorsSection';
import { RiskSection } from '@/features/reservation-risk/components/RiskSection';
import { getReservation } from '@/features/reservations/api/reservations.server';
import { ReservationDetailHeader } from '@/features/reservations/components/ReservationDetailHeader';
import { ReservationFacts } from '@/features/reservations/components/ReservationFacts';
import { formatReservationLabel } from '@/features/reservations/model/labels';
import { resolveBackHref } from '@/features/reservations/model/list-url';
import { hasErrorCode } from '@/lib/api/result';
import { isDecimalId } from '@/lib/api/schemas';

interface PageProps {
  params: Promise<{ reservationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { reservationId } = await params;
  return { title: isDecimalId(reservationId) ? formatReservationLabel(reservationId) : 'Reserva' };
}

/**
 * Detalle de una reserva. Los recursos independientes se cargan en paralelo y cada sección
 * gestiona su propio error: un fallo parcial no oculta la información factual.
 */
export default async function ReservationDetailPage({ params, searchParams }: PageProps) {
  const [{ reservationId }, search] = await Promise.all([params, searchParams]);
  if (!isDecimalId(reservationId)) notFound();

  const [detail, risk, catalog, history] = await Promise.all([
    getReservation(reservationId),
    getReservationRisk(reservationId),
    getModelCatalog(),
    getClientHistory(reservationId, 'booking_creation'),
  ]);
  if (hasErrorCode(detail, 'RESERVATION_NOT_FOUND')) notFound();

  return (
    <div key={reservationId}>
      <ReservationDetailHeader
        reservationId={reservationId}
        backHref={resolveBackHref(search.back)}
        detail={detail}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-5">
          <RiskSection reservationId={reservationId} risk={risk} catalog={catalog} />
          <RiskFactorsSection reservationId={reservationId} risk={risk} catalog={catalog} />
        </div>
        <div className="min-w-0 space-y-5">
          <ReservationFacts detail={detail} />
          <ClientHistorySection reservationId={reservationId} initial={history} />
        </div>
      </div>
    </div>
  );
}
