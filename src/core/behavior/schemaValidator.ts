import { ZodSchema } from "zod";

export function validateOutput<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: unknown } {

  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten()
    };
  }

  return {
    success: true,
    data: result.data
  };
}

