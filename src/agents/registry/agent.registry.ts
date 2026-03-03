import { AgentExecutor } from "../interfaces/agent.executor";
import { AgentCapabilityContract } from "../contracts/AgentCapabilityContract";

import { OrchestratorAgent } from "../runtime/orchestrator.agent";
import { StrategyAgent } from "../runtime/strategy.agent";
import { BuilderAgent } from "../runtime/builder.agent";
import { OpsAgent } from "../runtime/ops.agent";

interface RegisteredAgent {
  readonly executor: AgentExecutor;
  readonly contract: AgentCapabilityContract;
}

class StaticAgentRegistry {
  private readonly agents: Map<string, RegisteredAgent>;

  constructor(registrations: RegisteredAgent[]) {
    const map = new Map<string, RegisteredAgent>();

    for (const registration of registrations) {
      const { executor, contract } = registration;

      if (executor.name !== contract.agent_name) {
        throw new Error(
          `Capability contract mismatch for agent: ${executor.name}`
        );
      }

      if (map.has(executor.name)) {
        throw new Error(`Duplicate agent registration: ${executor.name}`);
      }

      map.set(executor.name, {
        executor,
        contract: Object.freeze(contract),
      });
    }

    this.agents = map;
  }

  get(name: string): AgentExecutor {
    const registered = this.agents.get(name);
    if (!registered) {
      throw new Error(`Agent not registered: ${name}`);
    }
    return registered.executor;
  }

  getContract(name: string): AgentCapabilityContract {
    const registered = this.agents.get(name);
    if (!registered) {
      throw new Error(`Agent not registered: ${name}`);
    }
    return registered.contract;
  }
}

export const agentRegistry = new StaticAgentRegistry([
  {
    executor: new OrchestratorAgent(),
    contract: {
      agent_name: "orchestrator",
      agent_version: "1.0.0",
      allowed_next_agents: ["strategy"],
      allowed_models: ["gpt-4o"],
      input_schema_id: "OrchestratorInputSchema_v1",
      output_schema_id: "OrchestratorOutputSchema_v1",
      prompt_version: "orchestrator_prompt_v1",
    },
  },
  {
    executor: new StrategyAgent(),
    contract: {
      agent_name: "strategy",
      agent_version: "1.0.0",
      allowed_next_agents: ["builder", "ops"],
      allowed_models: ["gpt-4o"],
      input_schema_id: "StrategyInputSchema_v1",
      output_schema_id: "StrategyOutputSchema_v1",
      prompt_version: "strategy_prompt_v1",
    },
  },
  {
    executor: new BuilderAgent(),
    contract: {
      agent_name: "builder",
      agent_version: "1.0.0",
      allowed_next_agents: ["ops"],
      allowed_models: ["gpt-4o"],
      input_schema_id: "BuilderInputSchema_v1",
      output_schema_id: "BuilderOutputSchema_v1",
      prompt_version: "builder_prompt_v1",
    },
  },
  {
    executor: new OpsAgent(),
    contract: {
      agent_name: "ops",
      agent_version: "1.0.0",
      allowed_next_agents: [],
      allowed_models: ["gpt-4o"],
      input_schema_id: "OpsInputSchema_v1",
      output_schema_id: "OpsOutputSchema_v1",
      prompt_version: "ops_prompt_v1",
    },
  },
]);
