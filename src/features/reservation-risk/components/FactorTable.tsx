import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import type { FactorDirection } from '@/features/reservation-risk/api/factors.contract';
import type { FactorView } from '@/features/reservation-risk/model/factors';

const DIRECTION_ICONS: Record<FactorDirection, typeof Minus> = {
  increases_model_output: ArrowUpRight,
  decreases_model_output: ArrowDownRight,
  neutral: Minus,
};

/** Alternativa textual del gráfico SHAP: factor, dirección y contribución con su unidad. */
export function FactorTable({
  factors,
  unitsLabel,
}: {
  factors: FactorView[];
  unitsLabel: string;
}) {
  return (
    <table className="w-full text-xs">
      <caption className="sr-only">Factores asociados a la estimación ({unitsLabel})</caption>
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th scope="col" className="py-1.5 pr-2 font-medium">
            Factor
          </th>
          <th scope="col" className="py-1.5 pr-2 font-medium">
            Asociación
          </th>
          <th scope="col" className="py-1.5 text-right font-medium">
            Contribución
          </th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {factors.map((factor) => {
          const Icon = DIRECTION_ICONS[factor.direction];
          return (
            <tr key={factor.featureName}>
              <th scope="row" className="py-2 pr-2 text-left font-normal">
                <span className="text-foreground">{factor.label}</span>
                {factor.sensitive && (
                  <span className="ml-1.5 inline-flex rounded border px-1 py-px text-[10px] text-muted-foreground">
                    Atributo sensible
                  </span>
                )}
              </th>
              <td className="py-2 pr-2 text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                  {factor.directionLabel}
                </span>
              </td>
              <td className="py-2 text-right font-mono tabular-nums">{factor.contributionText}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
