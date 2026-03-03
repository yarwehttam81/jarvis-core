import { agentRegistry } from "../agents/registry/agent.registry";

export interface AgentInspectionResult {
  agent_name: string;
  agent_version: string;
  allowed_next_agents: string[];
  allowed_models: string[];
  input_schema_id: string;
  output_schema_id: string;
  prompt_version: string;
}

export function inspectAgent(agentName: string): AgentInspectionResult {
  const contract = agentRegistry.getContract(agentName);

  return {
    agent_name: contract.agent_name,
    agent_version: contract.agent_version,
    allowed_next_agents: contract.allowed_next_agents,
    allowed_models: contract.allowed_models,
    input_schema_id: contract.input_schema_id,
    output_schema_id: contract.output_schema_id,
    prompt_version: contract.prompt_version,
  };
}
