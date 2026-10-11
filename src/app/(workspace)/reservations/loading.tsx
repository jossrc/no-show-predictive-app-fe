import { Skeleton } from '@/components/ui/skeleton';
import {
  FiltersSkeleton,
  ReservationsResultsSkeleton,
} from '@/features/reservations/components/ReservationsSkeleton';

export default function ReservationsLoading() {
  return (
    <>
      <div aria-hidden="true" className="mb-7 space-y-2.5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <FiltersSkeleton />
      <ReservationsResultsSkeleton />
    </>
  );
}
