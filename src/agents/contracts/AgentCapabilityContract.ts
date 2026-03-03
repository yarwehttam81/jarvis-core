export interface AgentCapabilityContract {
  readonly agent_name: string
  readonly agent_version: string

  // Explicitly allowed next agents for deterministic routing surface
  readonly allowed_next_agents: readonly string[]

  // Explicitly allowed models
  readonly allowed_models: readonly string[]

  // Schema identifiers (not runtime schema objects)
  readonly input_schema_id: string
  readonly output_schema_id: string

  // Static prompt version binding
  readonly prompt_version: string
}
