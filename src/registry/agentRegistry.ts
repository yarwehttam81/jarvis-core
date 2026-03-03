export interface ParallelBranchGroup {
  group_id: string
  agents: string[] // Deterministic execution order
  merge_agent: string // Must be statically declared
}

export interface AgentContract {
  agent_name: string
  agent_version: string
  allowed_models: string[]
  allowed_next_agents: string[]
  prompt_version: string

  // NEW — Deterministic Parallel Branch Declaration
  parallel_branches?: ParallelBranchGroup[]
}
