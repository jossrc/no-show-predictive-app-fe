import { Skeleton } from '@/components/ui/skeleton';

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card px-5 py-4 shadow-surface">
      <Skeleton className="h-5 w-44" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function ReservationDetailSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando detalle de la reserva…</span>
      <div aria-hidden="true">
        <div className="mb-7 space-y-2.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <SectionSkeleton lines={2} />
            <div className="space-y-3 rounded-xl border bg-card px-5 py-4 shadow-surface">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-28 w-full" />
            </div>
            <SectionSkeleton lines={1} />
          </div>
          <SectionSkeleton lines={6} />
        </div>
      </div>
    </div>
  );
}
