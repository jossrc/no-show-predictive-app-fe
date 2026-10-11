'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navigationItems } from '@/components/layout/navigation';
import { cn } from '@/lib/utils';

export function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex h-full items-stretch gap-1">
      {navigationItems.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative inline-flex items-center px-1 text-sm font-medium transition-colors hover:text-foreground',
              'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors',
              active
                ? 'text-foreground after:bg-brand'
                : 'text-muted-foreground after:bg-transparent',
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
