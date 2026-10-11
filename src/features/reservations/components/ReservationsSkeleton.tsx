import { Skeleton } from '@/components/ui/skeleton';

/** Esqueleto proporcional a la tabla real (filas densas, sin bloques gigantes). */
export function ReservationsResultsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-xl border bg-card shadow-surface"
    >
      <span className="sr-only">Cargando reservas…</span>
      <div aria-hidden="true">
        <div className="border-b px-5 py-3.5">
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="flex h-10 items-center gap-8 border-b bg-surface-subtle px-5">
          {[16, 28, 14, 18, 20].map((width, index) => (
            <Skeleton key={index} className="h-3" style={{ width: `${width * 4}px` }} />
          ))}
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-8 border-b px-5 py-4 last:border-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="hidden h-4 w-16 md:block" />
            <Skeleton className="hidden h-6 w-24 rounded-full md:block" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="ml-auto h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div aria-hidden="true" className="mb-5 rounded-xl border bg-card p-4 shadow-surface sm:p-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_8rem]">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="col-span-2 h-10 lg:col-span-1 lg:mt-[19px]" />
      </div>
      <div className="mt-4 flex justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}
