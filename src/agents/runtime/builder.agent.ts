import { AgentExecutor } from "../interfaces/agent.executor";
import { AgentResult } from "../interfaces/agent.types";

export class BuilderAgent implements AgentExecutor {
  readonly name = "builder";

  async execute(): Promise<AgentResult> {
    return {
      status: "completed",
      output: { step: "builder executed" },

      // Ledger-driven routing (matches previous static order)
      next_agent: "ops"
    };
  }
}
