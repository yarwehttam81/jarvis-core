import { z } from "zod";

/**
 * J.A.R.V.I.S Input Schema
 *
 * M8 — Input Enforcement (Minimal Surface)
 * Only validates actual executed input.
 */

export const JARVIS_INPUT_SCHEMA_VERSION = "1.0.0";

export const JarvisInputSchema = z.object({
  mission_id: z.string().min(1)
}).strict();

export type JarvisInput = z.infer<typeof JarvisInputSchema>;
