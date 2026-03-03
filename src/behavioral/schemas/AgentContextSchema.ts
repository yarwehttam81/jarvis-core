import { z } from "zod";

/**
 * AgentContextSchema
 *
 * Frozen behavioral envelope for all runtime agents.
 * Derived from ledger.
 *
 * Structural determinism unaffected.
 */

export const AgentContextSchema = z
  .object({
    missionId: z.string(),

    stageIndex: z.number().int().nonnegative(),

    missionInput: z.unknown(),

    priorStageOutputs: z.array(z.unknown()),

    input: z.unknown(),
  })
  .strict();

/**
 * Deterministic deep freeze utility.
 * Prevents runtime mutation of context envelope.
 */
export function deepFreeze<T>(obj: T): T {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value: any = (obj as any)[prop];

    if (
      value !== null &&
      (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });

  return obj;
}

export type AgentContextEnvelope = z.infer<typeof AgentContextSchema>;
