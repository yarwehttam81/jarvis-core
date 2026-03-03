import { z } from "zod";

export const DriftFieldDeltaSchema = z.object({
  field: z.enum([
    "prompt_version",
    "model",
    "next_agent",
    "output_structure"
  ]),
  baseline: z.any(),
  comparison: z.any(),
  drifted: z.boolean()
}).strict();

export const DriftComparisonResultSchema = z.object({
  missionId: z.string(),
  stageIndex: z.number(),
  baselineExecutionId: z.string(),
  comparisonExecutionId: z.string(),
  driftDetected: z.boolean(),
  deltas: z.array(DriftFieldDeltaSchema)
}).strict();

export type DriftComparisonResult = z.infer<
  typeof DriftComparisonResultSchema
>;
