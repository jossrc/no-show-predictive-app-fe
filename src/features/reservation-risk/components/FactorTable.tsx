import type { FactorView } from '@/features/reservation-risk/model/factors';

/** Solo los factores de mayor influencia; el resto de columnas queda oculto. */
export function FactorTable({ factors }: { factors: FactorView[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-[13px]">
        <caption className="sr-only">Factores con mayor influencia en la estimación</caption>
        <thead className="bg-surface-subtle">
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="px-3 py-2 font-medium">
              Factor
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {factors.map((factor) => (
            <tr key={factor.featureName}>
              <th scope="row" className="px-3 py-2.5 text-left font-normal text-foreground">
                {factor.label}
              </th>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
