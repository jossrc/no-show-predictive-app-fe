import { Skeleton } from '@/components/ui/skeleton';

/** Esqueleto proporcional a la tabla real (filas densas, sin bloques gigantes). */
export function ReservationsResultsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-xl border bg-card shadow-xs"
    >
      <span className="sr-only">Cargando reservas…</span>
      <div aria-hidden="true">
        <div className="flex h-10 items-center gap-6 border-b bg-surface-subtle px-4">
          {[24, 28, 16, 16, 24, 20].map((width, index) => (
            <Skeleton key={index} className="h-3" style={{ width: `${width * 4}px` }} />
          ))}
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-6 border-b px-4 py-3.5 last:border-0">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="hidden h-3.5 w-20 md:block" />
            <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
            <Skeleton className="ml-auto h-4 w-14 md:ml-0" />
            <Skeleton className="hidden h-5 w-24 rounded-full md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div aria-hidden="true" className="mb-4 rounded-xl border bg-card p-4 shadow-xs">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-[repeat(2,minmax(8.5rem,1fr))_minmax(8rem,1fr)_minmax(6rem,0.8fr)_minmax(12rem,1.5fr)_minmax(8rem,1fr)_minmax(9rem,1.1fr)_minmax(5rem,0.6fr)]">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end border-t pt-3">
        <Skeleton className="h-7 w-28" />
      </div>
    </div>
  );
}
