import { AgentContext, AgentResult } from "./agent.types";

export interface AgentExecutor {
  name: string;
  version: string;
  execute(context: AgentContext): Promise<AgentResult>;
}
