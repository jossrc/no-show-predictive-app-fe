import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState({ label = 'Cargando contenido…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64 max-w-full" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    </div>
  );
}
