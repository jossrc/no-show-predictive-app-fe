import { Skeleton } from '@/components/ui/skeleton';
import {
  FiltersSkeleton,
  ReservationsResultsSkeleton,
} from '@/features/reservations/components/ReservationsSkeleton';

export default function ReservationsLoading() {
  return (
    <>
      <div aria-hidden="true" className="mb-6 space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <FiltersSkeleton />
      <ReservationsResultsSkeleton />
    </>
  );
}
