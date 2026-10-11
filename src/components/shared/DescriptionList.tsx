import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface DescriptionItem {
  term: string;
  value: ReactNode;
}

/** Lista de pares término/valor (`<dl>`) para datos factuales. */
export function DescriptionList({
  items,
  className,
}: {
  items: DescriptionItem[];
  className?: string;
}) {
  return (
    <dl className={cn('divide-y text-sm', className)}>
      {items.map(({ term, value }) => (
        <div
          key={term}
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-2 first:pt-0 last:pb-0"
        >
          <dt className="text-muted-foreground">{term}</dt>
          <dd className="max-w-[16rem] min-w-0 text-right font-medium break-words tabular-nums">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
