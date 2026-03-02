import { z } from "zod";
import { BaseAgentOutputSchema } from "../../core/behavior/schema/outputSchemas";

/**
 * Orchestrator-specific deterministic output schema.
 */
export const OrchestratorOutputSchema = BaseAgentOutputSchema.extend({
  output: z.object({
    mission_id: z.string()
  })
}).strict();
