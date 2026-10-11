import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
  return (
    <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <MobileNavigation />
        <span className="text-sm font-medium">Espacio de trabajo</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden sm:inline-flex">
          En configuración
        </Badge>
        <ThemeToggle />
      </div>
    </header>
  );
}
