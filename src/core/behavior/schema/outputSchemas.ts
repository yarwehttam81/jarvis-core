import { z } from "zod";

/**
 * Deterministic AgentResult schema.
 * Must match AgentResult interface exactly.
 */
export const BaseAgentOutputSchema = z.object({
  status: z.literal("completed"),
  model: z.string(),
  prompt_version: z.string(),
  output: z.record(z.string(), z.unknown()),
  next_agent: z.string().nullable()
}).strict();
