import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

/** Estado vacío proporcionado al contenedor: sin tarjetas gigantes ni relleno ficticio. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="text-[15px] font-semibold tracking-tight">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-pretty text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
