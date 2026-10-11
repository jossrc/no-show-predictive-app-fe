import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/badge';

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-8">
      <div>
        <Badge variant="secondary" className="mb-4">
          En preparación
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <EmptyState
        title="Módulo en preparación"
        description="Este espacio se desarrollará en las próximas etapas del proyecto."
      />
    </div>
  );
}
