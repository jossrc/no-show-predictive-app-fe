'use client';

import { Bar, BarChart, Cell, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';

import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import type { OutputSpace } from '@/features/reservation-risk/api/factors.contract';
import {
  type FactorView,
  formatContribution,
  OUTPUT_SPACE_LABELS,
} from '@/features/reservation-risk/model/factors';

const chartConfig = {
  contribution: { label: 'Contribución' },
} satisfies ChartConfig;

const ROW_HEIGHT = 34;
const MAX_LABEL = 30;

function truncate(label: string): string {
  return label.length > MAX_LABEL ? `${label.slice(0, MAX_LABEL - 1)}…` : label;
}

function fillFor(contribution: number): string {
  if (contribution > 0) return 'var(--shap-increases)';
  if (contribution < 0) return 'var(--shap-decreases)';
  return 'var(--muted-foreground)';
}

/** Etiqueta en una sola línea (Recharts parte el texto en varias líneas por defecto). */
function CategoryTick(props: {
  x?: number | string;
  y?: number | string;
  payload?: { value?: unknown };
}) {
  return (
    <text
      x={props.x}
      y={props.y}
      dy={4}
      textAnchor="end"
      fontSize={11}
      fill="var(--muted-foreground)"
    >
      {String(props.payload?.value ?? '')}
    </text>
  );
}

interface ChartProps {
  factors: FactorView[];
  outputSpace: OutputSpace;
}

/**
 * Barras horizontales con signo en la unidad del `outputSpace` informado por la API.
 * Cada modelo tiene su propio eje: las escalas RF (probabilidad) y XGB (log-odds) no se comparan.
 * La tabla de factores es la alternativa textual completa de este gráfico.
 */
export default function RiskFactorsChart({ factors, outputSpace }: ChartProps) {
  const data = factors.map((factor) => ({ ...factor, display: truncate(factor.label) }));
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto w-full"
      style={{ height: data.length * ROW_HEIGHT + 36 }}
      role="img"
      aria-label={`Gráfico de contribuciones en ${OUTPUT_SPACE_LABELS[outputSpace].toLowerCase()}. La tabla siguiente contiene los mismos valores.`}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        barCategoryGap={8}
      >
        <XAxis
          type="number"
          domain={['auto', 'auto']}
          tickFormatter={(value: number) => formatContribution(value)}
          tickLine={false}
          axisLine={false}
          fontSize={11}
        />
        <YAxis
          type="category"
          dataKey="display"
          width={180}
          tickLine={false}
          axisLine={false}
          tick={CategoryTick}
        />
        <ReferenceLine x={0} stroke="var(--border)" strokeWidth={1.5} />
        <Tooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
          content={({ active, payload }) => {
            const item = payload?.[0]?.payload as (FactorView & { display: string }) | undefined;
            if (!active || !item) return null;
            return (
              <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-sm">
                <p className="font-medium">{item.label}</p>
                <p className="text-muted-foreground tabular-nums">
                  {item.contributionText} · {item.directionLabel.toLowerCase()}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="contribution" radius={3} isAnimationActive={false}>
          {data.map((factor) => (
            <Cell key={factor.featureName} fill={fillFor(factor.contribution)} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
