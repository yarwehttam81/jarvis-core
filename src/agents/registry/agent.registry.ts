import { AgentExecutor } from "../interfaces/agent.executor";
import { OrchestratorAgent } from "../runtime/orchestrator.agent";
import { StrategyAgent } from "../runtime/strategy.agent";
import { BuilderAgent } from "../runtime/builder.agent";
import { OpsAgent } from "../runtime/ops.agent";

class StaticAgentRegistry {
  private readonly agents: Map<string, AgentExecutor>;

  constructor(executors: AgentExecutor[]) {
    const map = new Map<string, AgentExecutor>();

    for (const executor of executors) {
      if (map.has(executor.name)) {
        throw new Error(`Duplicate agent registration: ${executor.name}`);
      }
      map.set(executor.name, executor);
    }

    this.agents = map;
  }

  get(name: string): AgentExecutor {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent not registered: ${name}`);
    }
    return agent;
  }
}

export const agentRegistry = new StaticAgentRegistry([
  new OrchestratorAgent(),
  new StrategyAgent(),
  new BuilderAgent(),
  new OpsAgent(),
]);
