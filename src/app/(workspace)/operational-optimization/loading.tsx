import { Skeleton } from '@/components/ui/skeleton';
import { OperationalTableSkeleton } from '@/features/operational-optimization/components/OperationalSkeletons';
import { FiltersSkeleton } from '@/features/reservations/components/ReservationsSkeleton';

export default function OperationalOptimizationLoading() {
  return (
    <>
      <div aria-hidden="true" className="mb-7 space-y-2.5">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <FiltersSkeleton />
      <div className="overflow-hidden rounded-xl border bg-card shadow-surface">
        <OperationalTableSkeleton label="Cargando optimización operativa…" />
      </div>
    </>
  );
}
