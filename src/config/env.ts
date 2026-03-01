import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  SLACK_BOT_TOKEN: z.string(),
  SLACK_SIGNING_SECRET: z.string(),
  OPENROUTER_API_KEY: z.string(),
  REPO_PATH: z.string()
});

export const env = envSchema.parse(process.env);
