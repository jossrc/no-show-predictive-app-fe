import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xs font-medium text-muted-foreground tabular-nums">404</p>
      <h1 className="text-xl font-semibold tracking-tight">No encontramos esta página</h1>
      <Button asChild size="sm">
        <Link href="/reservations">Ir a reservas</Link>
      </Button>
    </main>
  );
}
