'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navigationItems } from '@/components/layout/navigation';
import { cn } from '@/lib/utils';

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex items-center gap-1">
      {navigationItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-8 items-center gap-2 rounded-md px-2.5 text-sm transition-colors hover:bg-muted hover:text-foreground',
              active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
