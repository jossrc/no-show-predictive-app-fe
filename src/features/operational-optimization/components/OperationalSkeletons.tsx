import { Skeleton } from '@/components/ui/skeleton';

/** Esqueleto proporcional de «Gestión operativa» mientras se consultan sus tres estados. */
export function OperationalSectionSkeleton() {
  return (
    <div role="status" className="space-y-3 rounded-xl border bg-card px-5 py-4 shadow-surface">
      <span className="sr-only">Cargando la gestión operativa…</span>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

/** Esqueleto de una tabla de bloque (alto riesgo o seguimiento). */
export function OperationalTableSkeleton({ label, rows = 4 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-0">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-8 border-b px-5 py-4 last:border-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="hidden h-4 w-16 md:block" />
            <Skeleton className="hidden h-6 w-28 rounded-full md:block" />
            <Skeleton className="ml-auto h-8 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}
