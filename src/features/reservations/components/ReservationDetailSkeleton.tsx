import { Skeleton } from '@/components/ui/skeleton';

function SectionSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-xl border bg-card shadow-xs">
      <div className="border-b px-5 py-3.5">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-2.5 px-5 py-4">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ReservationDetailSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando detalle de la reserva…</span>
      <div aria-hidden="true">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="rounded-xl border bg-card p-5 shadow-xs">
              <Skeleton className="mb-4 h-4 w-44" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
              </div>
            </div>
            <SectionSkeleton lines={2} />
          </div>
          <div className="space-y-5">
            <SectionSkeleton lines={6} />
            <SectionSkeleton lines={5} />
          </div>
        </div>
      </div>
    </div>
  );
}
