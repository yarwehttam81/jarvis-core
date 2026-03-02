import { z } from "zod";
import { BaseAgentOutputSchema } from "../../core/behavior/schema/outputSchemas";

export const JarvisOutputSchema = BaseAgentOutputSchema.extend({
  payload: z.object({
    classification: z.string(),
  })
}).strict();
