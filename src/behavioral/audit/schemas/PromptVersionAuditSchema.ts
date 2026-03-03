import { z } from "zod";

/**
 * Individual prompt version record observed in ledger
 */
export const PromptVersionRecordSchema = z.object({
  agent_name: z.string(),
  agent_version: z.string(),
  prompt_version: z.string(),
  model: z.string(),
  mission_id: z.string(),
  stage_index: z.number().int().nonnegative()
}).strict();

/**
 * Aggregated audit summary per agent_version
 */
export const PromptVersionAggregateSchema = z.object({
  agent_name: z.string(),
  agent_version: z.string(),
  observed_prompt_versions: z.array(z.string()).nonempty(),
  models_used: z.array(z.string()).nonempty(),
  total_occurrences: z.number().int().nonnegative(),
  drift_detected: z.boolean()
}).strict();

/**
 * Full audit result
 */
export const PromptVersionAuditResultSchema = z.object({
  audit_version: z.literal("v1"),
  generated_at: z.string(),
  total_records: z.number().int().nonnegative(),
  aggregates: z.array(PromptVersionAggregateSchema),
  records: z.array(PromptVersionRecordSchema)
}).strict();

export type PromptVersionRecord = z.infer<typeof PromptVersionRecordSchema>;
export type PromptVersionAggregate = z.infer<typeof PromptVersionAggregateSchema>;
export type PromptVersionAuditResult = z.infer<typeof PromptVersionAuditResultSchema>;
