import { AgentContext, AgentResult } from "./agent.types";

export interface AgentExecutor {
  readonly name: string;

  execute(
    context: AgentContext
  ): Promise<AgentResult>;
}
