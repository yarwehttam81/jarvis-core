import { AgentExecutor } from "../interfaces/agent.executor";
import { AgentResult } from "../interfaces/agent.types";

export class StrategyAgent implements AgentExecutor {
  readonly name = "strategy";

  async execute(): Promise<AgentResult> {
    return {
      status: "completed",
      output: { step: "strategy executed" },

      // Ledger-driven routing (matches previous static order)
      next_agent: "builder"
    };
  }
}
