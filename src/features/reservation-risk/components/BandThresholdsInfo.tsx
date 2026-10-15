'use client';

import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface BandThresholdRow {
  label: string;
  lowUpper: string;
  highLower: string;
}

/** Explicación opcional de las bandas relativas; no altera el cálculo. */
export function BandThresholdsInfo({ models }: { models: BandThresholdRow[] }) {
  if (models.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Cómo funciona esta puntuación"
          className="text-muted-foreground"
        >
          <Info />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cómo funciona esta puntuación</DialogTitle>
          <DialogDescription>
            Las bandas Bajo, Medio y Alto se asignan según el porcentaje de cada modelo.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-subtle">
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th scope="col" className="px-3 py-2 font-medium">
                  Modelo
                </th>
                <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  Bajo
                </th>
                <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  Medio
                </th>
                <th scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  Alto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {models.map((model) => (
                <tr key={model.label}>
                  <th scope="row" className="px-3 py-2.5 text-left font-medium whitespace-nowrap">
                    {model.label}
                  </th>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                    Menor a {model.lowUpper}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                    {model.lowUpper} a menos de {model.highLower}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                    Desde {model.highLower}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Umbrales aproximados a dos decimales. El sistema utiliza valores internos de mayor
          precisión. Estos límites se calcularon mediante terciles de las puntuaciones de cada
          modelo.
        </p>
      </DialogContent>
    </Dialog>
  );
}
