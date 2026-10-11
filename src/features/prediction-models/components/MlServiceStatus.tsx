import { getMlHealth } from '@/features/prediction-models/api/models.server';
import { type HealthTone, toHealthView } from '@/features/prediction-models/model/health-view';
import { cn } from '@/lib/utils';

const DOT_CLASSES: Record<HealthTone, string> = {
  available: 'bg-primary',
  unavailable: 'bg-warning',
  unknown: 'bg-muted-foreground/50',
};

export function MlServiceStatusView({ tone, label, description }: ReturnType<typeof toHealthView>) {
  return (
    <span
      title={description}
      className="inline-flex h-7 items-center gap-1.5 rounded-full border bg-background px-2.5 text-xs text-muted-foreground"
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', DOT_CLASSES[tone])} />
      <span className="hidden sm:inline">{label}</span>
      <span className="sr-only">. {description}</span>
    </span>
  );
}

/** Consulta única por render del layout (sin polling). Su fallo no bloquea la aplicación. */
export async function MlServiceStatus() {
  const view = toHealthView(await getMlHealth());
  return <MlServiceStatusView {...view} />;
}
