'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarCheck2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  loadOverbookingStateAction,
  type WriteOutcome,
} from '@/features/operational-optimization/api/operational.actions';
import type { OverbookingState } from '@/features/operational-optimization/api/overbooking.contract';
import { EnableOverbookingForm } from '@/features/operational-optimization/components/EnableOverbookingForm';
import {
  EnabledAuthorization,
  IneligibleReasons,
} from '@/features/operational-optimization/components/OverbookingStateViews';
import { useOperationalWrite } from '@/features/operational-optimization/components/use-operational-write';
import { WriteResultMessage } from '@/features/operational-optimization/components/WriteResultMessage';
import { operationalErrorText } from '@/features/operational-optimization/model/errors';
import {
  canEnableOverbooking,
  ineligibilityReasons,
} from '@/features/operational-optimization/model/overbooking-view';
import type { ModelKey } from '@/features/prediction-models/api/contract';
import type { ApiResult } from '@/lib/api/result';
import { networkFailure } from '@/lib/errors/api-errors';

const TITLE = 'Habilitar para sobreasignación';

interface Props {
  reservationId: string;
  /** Contexto visible de la cita (p. ej. «Reserva #… · 12 nov. 2026 · 3:00 p. m.»). */
  context: string;
  /** Modelo consultado en la vista (se preselecciona si el backend lo considera elegible). */
  preferredModelKey?: ModelKey;
  /**
   * false oculta el botón (p. ej. la marca ya existe) sin desmontar el diálogo: tras registrar,
   * la ruta se actualiza y el resultado debe seguir visible hasta que la persona lo cierre.
   */
  showTrigger?: boolean;
  size?: 'sm' | 'default';
}

/**
 * HU-06 · Acción «Habilitar para sobreasignación» con confirmación explícita. Al abrirse consulta
 * el estado y la elegibilidad del backend (GET): un botón visible no implica que sea elegible.
 */
export function OverbookingDialog({
  reservationId,
  context,
  preferredModelKey,
  showTrigger = true,
  size = 'sm',
}: Props) {
  const [open, setOpen] = useState(false);
  if (!showTrigger && !open) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size={size} aria-label={`${TITLE} · ${context}`}>
            <CalendarCheck2 aria-hidden="true" />
            {TITLE}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{TITLE}</DialogTitle>
          <DialogDescription className="tabular-nums">{context}</DialogDescription>
        </DialogHeader>
        {open && <DialogBody reservationId={reservationId} preferredModelKey={preferredModelKey} />}
      </DialogContent>
    </Dialog>
  );
}

function useOverbookingState(reservationId: string) {
  return useQuery({
    queryKey: ['overbooking-state', reservationId],
    queryFn: async (): Promise<ApiResult<OverbookingState>> => {
      try {
        return await loadOverbookingStateAction(reservationId);
      } catch {
        return networkFailure();
      }
    },
    // Cada apertura consulta la elegibilidad vigente: nunca se confía en un estado previo.
    staleTime: 0,
    gcTime: 0,
  });
}

function DialogBody({
  reservationId,
  preferredModelKey,
}: Pick<Props, 'reservationId' | 'preferredModelKey'>) {
  const router = useRouter();
  const query = useOverbookingState(reservationId);
  const write = useOperationalWrite<WriteOutcome>();
  const reload = () => {
    void query.refetch();
    router.refresh();
  };

  const message = write.result && (
    <div aria-live="polite">
      <WriteResultMessage
        result={write.result}
        successTitle="Horario habilitado para sobreasignación"
        replayedTitle="El horario ya estaba habilitado"
        successText="La marca quedó registrada para análisis posterior de Call Center."
        onRefreshState={reload}
      />
    </div>
  );

  if (!query.data) return <StateSkeleton />;
  const result = query.data;
  if (!result.ok) {
    return (
      <ApiErrorNotice
        error={result.error}
        {...operationalErrorText(result.error)}
        action={
          <Button variant="outline" size="sm" onClick={reload}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const state = result.data;
  return (
    <div className="space-y-4" aria-busy={query.isFetching}>
      {message}
      {state.enabled ? (
        <EnabledAuthorization authorization={state.authorization} />
      ) : canEnableOverbooking(state) ? (
        <EnableOverbookingForm
          reservationId={reservationId}
          state={state}
          write={write}
          preferredModelKey={preferredModelKey}
          onSettled={() => void query.refetch()}
        />
      ) : (
        <IneligibleReasons reasons={ineligibilityReasons(state)} />
      )}
    </div>
  );
}

function StateSkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Consultando el estado del horario…</span>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-16" />
      <Skeleton className="ml-auto h-9 w-40" />
    </div>
  );
}
