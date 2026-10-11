'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navigationItems } from '@/components/layout/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col p-5">
      <Link href="/" onClick={onNavigate} className="mb-10 flex items-center gap-3 rounded-md">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles aria-hidden="true" className="size-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Agenda Predictiva</span>
          <span className="text-xs text-muted-foreground">Estética y cuidado personal</span>
        </span>
      </Link>
      <p className="mb-3 px-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Espacio de trabajo
      </p>
      <nav aria-label="Navegación principal" className="space-y-1">
        {navigationItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={pathname === href ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
              pathname === href
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t pt-5">
        <Badge variant="secondary">Fundación técnica</Badge>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Un espacio para preparar una atención más organizada.
        </p>
      </div>
    </div>
  );
}
