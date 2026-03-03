import { z } from "zod";

export const FailureEnvelopeSchema = z.object({
  status: z.literal("failed"),
  error_code: z.string(),
  error_details: z.unknown().optional(),
  agent_name: z.string(),
  agent_version: z.string(),
  stage_index: z.number(),
  failure_version: z.literal("v1")
});

export type FailureEnvelope = z.infer<typeof FailureEnvelopeSchema>;
