import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import type {
  FactorDirection,
  OutputSpace,
} from '@/features/reservation-risk/api/factors.contract';
import {
  type FactorView,
  OUTPUT_SPACE_UNIT_HINTS,
  OUTPUT_SPACE_UNITS,
} from '@/features/reservation-risk/model/factors';

const DIRECTION_ICONS: Record<FactorDirection, typeof Minus> = {
  increases_model_output: ArrowUpRight,
  decreases_model_output: ArrowDownRight,
  neutral: Minus,
};

/**
 * Factores en una tabla (sin gráficos): factor, efecto sobre el cálculo y contribución con la
 * unidad del modelo explicado. RF y XGBoost no comparten unidad y nunca se mezclan.
 */
export function FactorTable({
  factors,
  outputSpace,
}: {
  factors: FactorView[];
  outputSpace: OutputSpace;
}) {
  const unit = OUTPUT_SPACE_UNITS[outputSpace];
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-[13px]">
        <caption className="sr-only">
          Factores relacionados con la estimación, contribución en {unit}
        </caption>
        <thead className="bg-surface-subtle">
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">
              Factor
            </th>
            <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">
              Efecto en el cálculo
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium whitespace-nowrap">
              Contribución ({unit})
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {factors.map((factor) => {
            const Icon = DIRECTION_ICONS[factor.direction];
            return (
              <tr key={factor.featureName}>
                <th scope="row" className="px-3 py-2.5 text-left font-normal">
                  <span className="text-foreground">{factor.label}</span>
                  {factor.sensitive && (
                    <span className="ml-2 inline-flex rounded-md border px-1.5 py-px text-[11px] text-muted-foreground">
                      Dato sensible
                    </span>
                  )}
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
                    <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                    {factor.directionLabel}
                  </span>
                </th>
                <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                    {factor.directionLabel}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                  {factor.contributionText}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t bg-surface-subtle px-3 py-2 text-xs text-muted-foreground">
        {OUTPUT_SPACE_UNIT_HINTS[outputSpace]}
      </p>
    </div>
  );
}
