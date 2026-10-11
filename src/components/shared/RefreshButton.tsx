'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Vuelve a consultar la ruta actual en el servidor (sin caché). Nunca ejecuta mutaciones.
 */
export function RefreshButton({ label = 'Actualizar' }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw aria-hidden="true" className={cn(pending && 'animate-spin')} />
      {pending ? 'Actualizando…' : label}
    </Button>
  );
}
