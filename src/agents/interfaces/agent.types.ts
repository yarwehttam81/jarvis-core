export interface AgentContext {
  missionId: string;
  stageIndex: number;
  missionInput: unknown;
  priorStageOutputs: Record<number, unknown>;
  input: unknown;
}

export interface AgentResult<T = Record<string, unknown>> {
  status: "completed";

  /**
   * Model identifier used for this execution.
   * Required for deterministic replay auditing.
   */
  model: string;

  /**
   * Static system prompt version identifier.
   * Required for prompt governance.
   */
  prompt_version: string;

  /**
   * Structured agent payload.
   */
  output: T;

  /**
   * Ledger-driven routing signal.
   * null → mission complete
   */
  next_agent: string | null;
}
