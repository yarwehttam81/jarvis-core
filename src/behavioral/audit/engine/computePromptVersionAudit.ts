import { PromptVersionAuditResultSchema } from "../schemas/PromptVersionAuditSchema";
import type {
  PromptVersionAuditResult,
  PromptVersionRecord,
  PromptVersionAggregate
} from "../schemas/PromptVersionAuditSchema";

/**
 * Deterministic prompt version audit engine
 * Ledger-derived input only
 * Pure function
 * No side effects
 */
export function computePromptVersionAudit(
  missionStageOutputs: Array<{
    mission_id: string;
    stage_index: number;
    agent_name: string;
    agent_version: string;
    prompt_version: string;
    model: string;
  }>
): PromptVersionAuditResult {
  // Deterministic copy (no mutation of input)
  const records: PromptVersionRecord[] = missionStageOutputs.map((entry) => ({
    agent_name: entry.agent_name,
    agent_version: entry.agent_version,
    prompt_version: entry.prompt_version,
    model: entry.model,
    mission_id: entry.mission_id,
    stage_index: entry.stage_index
  }));

  // Sort deterministically
  records.sort((a, b) => {
    if (a.agent_name !== b.agent_name) return a.agent_name.localeCompare(b.agent_name);
    if (a.agent_version !== b.agent_version) return a.agent_version.localeCompare(b.agent_version);
    if (a.mission_id !== b.mission_id) return a.mission_id.localeCompare(b.mission_id);
    return a.stage_index - b.stage_index;
  });

  // Aggregate by agent_name + agent_version
  const aggregateMap = new Map<string, {
    agent_name: string;
    agent_version: string;
    prompt_versions: Set<string>;
    models: Set<string>;
    count: number;
  }>();

  for (const record of records) {
    const key = `${record.agent_name}::${record.agent_version}`;

    if (!aggregateMap.has(key)) {
      aggregateMap.set(key, {
        agent_name: record.agent_name,
        agent_version: record.agent_version,
        prompt_versions: new Set<string>(),
        models: new Set<string>(),
        count: 0
      });
    }

    const agg = aggregateMap.get(key)!;
    agg.prompt_versions.add(record.prompt_version);
    agg.models.add(record.model);
    agg.count += 1;
  }

  const aggregates: PromptVersionAggregate[] = Array.from(aggregateMap.values())
    .sort((a, b) => {
      if (a.agent_name !== b.agent_name) return a.agent_name.localeCompare(b.agent_name);
      return a.agent_version.localeCompare(b.agent_version);
    })
    .map((agg) => ({
      agent_name: agg.agent_name,
      agent_version: agg.agent_version,
      observed_prompt_versions: Array.from(agg.prompt_versions).sort(),
      models_used: Array.from(agg.models).sort(),
      total_occurrences: agg.count,
      drift_detected: agg.prompt_versions.size > 1
    }));

  const result: PromptVersionAuditResult = {
    audit_version: "v1",
    generated_at: new Date().toISOString(),
    total_records: records.length,
    aggregates,
    records
  };

  // Strict schema validation before returning
  return PromptVersionAuditResultSchema.parse(result);
}
