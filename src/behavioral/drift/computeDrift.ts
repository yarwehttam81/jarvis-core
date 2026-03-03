import { DriftComparisonResultSchema } from "./DriftComparisonSchema";

/**
 * Extracts structural shape of an object (keys only, recursively)
 * Used for deterministic structure comparison.
 */
function extractStructure(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(extractStructure);
  }

  if (value !== null && typeof value === "object") {
    const sortedKeys = Object.keys(value as Record<string, unknown>).sort();

    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = extractStructure(
        (value as Record<string, unknown>)[key]
      );
    }

    return result;
  }

  return typeof value;
}

/**
 * Deterministic shallow equality using JSON stringify.
 * Safe because structure is sorted beforehand.
 */
function deterministicEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

interface PersistedStageOutput {
  executionId: string;
  missionId: string;
  stageIndex: number;
  prompt_version: string;
  model: string;
  next_agent: string | null;
  output: unknown;
}

export function computeDrift(
  baseline: PersistedStageOutput,
  comparison: PersistedStageOutput
) {
  if (
    baseline.missionId !== comparison.missionId ||
    baseline.stageIndex !== comparison.stageIndex
  ) {
    throw new Error("Drift comparison mismatch: mission or stage differs");
  }

  const deltas = [];

  // prompt_version
  const promptVersionDrift =
    baseline.prompt_version !== comparison.prompt_version;

  deltas.push({
    field: "prompt_version",
    baseline: baseline.prompt_version,
    comparison: comparison.prompt_version,
    drifted: promptVersionDrift
  });

  // model
  const modelDrift = baseline.model !== comparison.model;

  deltas.push({
    field: "model",
    baseline: baseline.model,
    comparison: comparison.model,
    drifted: modelDrift
  });

  // next_agent
  const nextAgentDrift =
    baseline.next_agent !== comparison.next_agent;

  deltas.push({
    field: "next_agent",
    baseline: baseline.next_agent,
    comparison: comparison.next_agent,
    drifted: nextAgentDrift
  });

  // output structure (shape only)
  const baselineStructure = extractStructure(baseline.output);
  const comparisonStructure = extractStructure(comparison.output);

  const outputStructureDrift = !deterministicEqual(
    baselineStructure,
    comparisonStructure
  );

  deltas.push({
    field: "output_structure",
    baseline: baselineStructure,
    comparison: comparisonStructure,
    drifted: outputStructureDrift
  });

  const driftDetected = deltas.some((d) => d.drifted);

  const result = {
    missionId: baseline.missionId,
    stageIndex: baseline.stageIndex,
    baselineExecutionId: baseline.executionId,
    comparisonExecutionId: comparison.executionId,
    driftDetected,
    deltas
  };

  // Final deterministic schema validation
  return DriftComparisonResultSchema.parse(result);
}
