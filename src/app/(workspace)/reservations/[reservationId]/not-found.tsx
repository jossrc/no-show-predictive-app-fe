import { SearchX } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function ReservationNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-card shadow-xs">
      <EmptyState
        icon={SearchX}
        title="Reserva no encontrada"
        description="La reserva no existe o no está disponible para esta consulta (RESERVATION_NOT_FOUND)."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/reservations">Volver al listado de reservas</Link>
          </Button>
        }
      />
    </div>
  );
}
