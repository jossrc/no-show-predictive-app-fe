import { z } from 'zod';

/** Bandas relativas de investigación: independientes del riesgo operativo (`riskLevel`). */
export const experimentalRiskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type ExperimentalRiskLevel = z.infer<typeof experimentalRiskLevelSchema>;

export const experimentalRiskSummarySchema = z.object({
  level: experimentalRiskLevelSchema,
  label: z.enum(['Bajo (exploratorio)', 'Medio (exploratorio)', 'Alto (exploratorio)']),
  status: z.literal('RESEARCH_PROVISIONAL'),
  policyId: z.string(),
  policyVersion: z.string(),
  policyHash: z.string(),
});

/** El detalle de riesgo contiene la política completa persistida con cada modelo. */
export const experimentalRiskSchema = experimentalRiskSummarySchema.extend({
  classificationBasis: z.literal('RESEARCH_PROVISIONAL'),
  lowUpperThreshold: z.number().gt(0).lt(1),
  highLowerThreshold: z.number().gt(0).lt(1),
  boundaryRule: z.string(),
  meaning: z.literal('relative_score_band_not_validated_absolute_risk'),
  scoreSpace: z.literal('raw_probability_no_show'),
  warnings: z.array(z.string()),
  approvedBy: z.null(),
  operationalUseAllowed: z.literal(false),
});

/** Política vigente para el modelo elegido al filtrar y paginar el listado. */
export const experimentalRiskPolicySchema = experimentalRiskSummarySchema
  .omit({ level: true, label: true })
  .extend({
    modelKey: z.string(),
    classificationBasis: z.literal('RESEARCH_PROVISIONAL'),
    operationalUseAllowed: z.literal(false),
    notice: z.string(),
  });

export const classificationAvailabilityFields = {
  operationalClassificationUnavailable: z.boolean(),
  experimentalClassificationUnavailable: z.boolean(),
};
