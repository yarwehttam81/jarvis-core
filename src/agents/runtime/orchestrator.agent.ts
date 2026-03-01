import { AgentExecutor } from "../interfaces/agent.executor";
import { AgentResult } from "../interfaces/agent.types";

export class OrchestratorAgent implements AgentExecutor {
  readonly name = "orchestrator";

  async execute(): Promise<AgentResult> {
    return {
      status: "completed",
      output: { step: "orchestrator executed" },

      // Ledger-driven routing (matches previous static order)
      next_agent: "strategy"
    };
  }
}
