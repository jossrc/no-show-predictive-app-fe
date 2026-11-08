'use client';

import { LoaderCircle } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { IMMUTABLE_RECORD_NOTICE } from '@/features/operational-optimization/model/labels';

interface Props {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmación en línea previa a un registro inmutable. Recibe el foco al aparecer para que
 * teclado y lectores de pantalla lleguen directamente a la decisión.
 */
export function ConfirmStep(props: Props) {
  const { title, children, confirmLabel, pendingLabel, pending, onConfirm, onCancel } = props;
  const headingId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => confirmRef.current?.focus(), []);

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="space-y-3 rounded-lg border border-warning-border bg-warning-surface px-3.5 py-3 text-[13px]"
    >
      <div className="space-y-1">
        <p id={headingId} className="font-medium text-foreground">
          {title}
        </p>
        <div className="text-foreground/90">{children}</div>
        <p className="text-muted-foreground">{IMMUTABLE_RECORD_NOTICE}</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={pending}>
          Volver
        </Button>
        <Button
          ref={confirmRef}
          size="sm"
          onClick={onConfirm}
          disabled={pending}
          aria-busy={pending}
        >
          {pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
