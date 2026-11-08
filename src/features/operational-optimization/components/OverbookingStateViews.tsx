import { DescriptionList } from '@/components/shared/DescriptionList';
import { Notice } from '@/components/shared/Notice';
import type { OverbookingAuthorization } from '@/features/operational-optimization/api/overbooking.contract';
import { EnabledMark } from '@/features/operational-optimization/components/OverbookingMarkBadge';
import {
  OVERBOOKING_ENABLED_LABEL,
  OVERBOOKING_MEANING,
} from '@/features/operational-optimization/model/labels';
import { authorizationItems } from '@/features/operational-optimization/model/overbooking-view';

/** Marca HU-06 registrada: estado, fecha, modelo y estimación al habilitar (sin edición). */
export function EnabledAuthorization({
  authorization,
}: {
  authorization: OverbookingAuthorization | null;
}) {
  return (
    <div className="space-y-3">
      <EnabledMark label={authorization?.statusLabel ?? OVERBOOKING_ENABLED_LABEL} />
      {authorization && <DescriptionList items={authorizationItems(authorization)} />}
      <p className="text-xs text-pretty text-muted-foreground">{OVERBOOKING_MEANING}</p>
    </div>
  );
}

/** Motivos del backend por los que el horario no puede habilitarse (sin acción disponible). */
export function IneligibleReasons({ reasons }: { reasons: string[] }) {
  return (
    <Notice title="Este horario no se puede habilitar">
      {reasons.length > 0 ? (
        <ul className="list-disc space-y-0.5 pl-4">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p>No cumple las condiciones de habilitación.</p>
      )}
    </Notice>
  );
}
