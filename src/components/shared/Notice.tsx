import { Info, type LucideIcon, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type NoticeTone = 'neutral' | 'warning';

const TONES: Record<NoticeTone, { icon: LucideIcon; className: string }> = {
  neutral: { icon: Info, className: 'border-border bg-surface-subtle text-muted-foreground' },
  warning: {
    icon: TriangleAlert,
    className: 'border-warning-border bg-warning-surface text-foreground [&>svg]:text-warning',
  },
};

interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

/** Aviso discreto en línea (frescura, política científica, modo de datos). */
export function Notice({ tone = 'neutral', title, children, className }: NoticeProps) {
  const { icon: Icon, className: toneClassName } = TONES[tone];
  return (
    <div
      className={cn(
        'flex gap-2.5 rounded-lg border px-3 py-2.5 text-xs leading-relaxed',
        toneClassName,
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-medium text-foreground">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
