export interface AgentContext {
  missionId: string;
  stageIndex: number;
  missionInput: unknown;
  priorStageOutputs: Record<number, unknown>;
  input: unknown;
}

export interface AgentResult<T = unknown> {
  status: "completed";
  output: T;

  /**
   * Ledger-driven routing signal.
   * Determines next agent to execute.
   * null → mission complete
   */
  next_agent: string | null;
}
