import { SearchX } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export default function ReservationNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border bg-card shadow-surface">
      <EmptyState
        icon={SearchX}
        title="No encontramos esta reserva"
        description="Verifica el identificador o vuelve al listado."
        action={
          <Button asChild variant="outline">
            <Link href="/reservations">Volver a reservas</Link>
          </Button>
        }
      />
    </div>
  );
}
