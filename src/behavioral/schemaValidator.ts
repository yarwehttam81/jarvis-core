import { ZodSchema } from "zod";

export interface SchemaValidationContext {
  agent_name: string;
  agent_version: string;
  stage_id: string;
  mission_id: string;
}

export class SchemaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

/**
 * Deterministic Input Schema Validation
 *
 * - No coercion
 * - No mutation
 * - No defaults
 * - Fail closed
 */
export function validateInputSchema<T>(
  schema: ZodSchema<T>,
  input: unknown,
  context: SchemaValidationContext
): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    const formattedErrors = result.error.issues
      .map(issue => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");

    throw new SchemaValidationError(
      `Input schema validation failed for ${context.agent_name}@${context.agent_version} ` +
      `(mission=${context.mission_id}, stage=${context.stage_id}): ${formattedErrors}`
    );
  }

  return result.data;
}
