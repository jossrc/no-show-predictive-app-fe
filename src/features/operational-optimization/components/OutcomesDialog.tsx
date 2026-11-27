'use client';

import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import { ApiErrorNotice } from '@/components/shared/ApiErrorNotice';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  loadOutcomeStatesAction,
  type OutcomeStates,
} from '@/features/operational-optimization/api/operational.actions';
import { AttendancePanel } from '@/features/operational-optimization/components/AttendancePanel';
import { RecoveryPanel } from '@/features/operational-optimization/components/RecoveryPanel';
import { operationalErrorText } from '@/features/operational-optimization/model/errors';
import type { ApiResult } from '@/lib/api/result';
import { networkFailure } from '@/lib/errors/api-errors';

const TITLE = 'Registrar resultados';

interface Props {
  reservationId: string;
  context: string;
}

/**
 * HU-07/HU-08 desde el seguimiento: «¿Asistió?» y «¿Espacio recuperado?» de una cita gestionada.
 * El estado completo se consulta solo al abrir el diálogo (sin lecturas por fila al renderizar).
 * Ambos registros son independientes: HU-08 no requiere HU-07.
 */
export function OutcomesDialog({ reservationId, context }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" aria-label={`${TITLE} · ${context}`}>
          <ClipboardCheck aria-hidden="true" />
          {TITLE}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{TITLE}</DialogTitle>
          <DialogDescription className="tabular-nums">{context}</DialogDescription>
        </DialogHeader>
        {open && <OutcomesBody reservationId={reservationId} />}
      </DialogContent>
    </Dialog>
  );
}

function OutcomesBody({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ['outcome-states', reservationId],
    queryFn: async (): Promise<OutcomeStates> => {
      try {
        return await loadOutcomeStatesAction(reservationId);
      } catch {
        return { attendance: networkFailure(), recovery: networkFailure(), runs: [] };
      }
    },
    staleTime: 0,
    gcTime: 0,
  });
  const reload = () => {
    void query.refetch();
    router.refresh();
  };

  if (!query.data) return <BodySkeleton />;
  const { attendance, recovery, runs } = query.data;
  return (
    <div className="space-y-5" aria-busy={query.isFetching}>
      <Part title="¿Asistió?">
        {attendance.ok ? (
          <AttendancePanel
            reservationId={reservationId}
            state={attendance.data}
            runs={runs}
            onChanged={() => void query.refetch()}
          />
        ) : (
          <PartError result={attendance} onRetry={reload} />
        )}
      </Part>
      <Part title="¿Espacio recuperado?">
        {recovery.ok ? (
          <RecoveryPanel
            reservationId={reservationId}
            state={recovery.data}
            onChanged={() => void query.refetch()}
          />
        ) : (
          <PartError result={recovery} onRetry={reload} />
        )}
      </Part>
    </div>
  );
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5 border-t pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function PartError({
  result,
  onRetry,
}: {
  result: Extract<ApiResult<unknown>, { ok: false }>;
  onRetry: () => void;
}) {
  return (
    <ApiErrorNotice
      error={result.error}
      {...operationalErrorText(result.error)}
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      }
    />
  );
}

function BodySkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Consultando los resultados de la cita…</span>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-16" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-16" />
    </div>
  );
}
