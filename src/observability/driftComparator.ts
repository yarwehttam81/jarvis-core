import { inspectMission } from "./missionInspector";

export interface DriftDelta {
  stageIndex: number;
  differences: {
    agent_version?: { a: string; b: string };
    prompt_version?: { a: string; b: string };
    model?: { a: string; b: string };
    status?: { a: string; b: string };
    failure_version?: { a: string | null; b: string | null };
  };
}

export interface DriftComparisonResult {
  missionA: string;
  missionB: string;
  stageCountA: number;
  stageCountB: number;
  deltas: DriftDelta[];
}

export async function compareMissions(
  missionA: string,
  missionB: string
): Promise<DriftComparisonResult> {
  const a = await inspectMission(missionA);
  const b = await inspectMission(missionB);

  const maxStages = Math.max(a.stages.length, b.stages.length);
  const deltas: DriftDelta[] = [];

  for (let i = 0; i < maxStages; i++) {
    const stageA = a.stages[i];
    const stageB = b.stages[i];

    if (!stageA || !stageB) {
      deltas.push({
        stageIndex: i,
        differences: {},
      });
      continue;
    }

    const differences: DriftDelta["differences"] = {};

    if (stageA.agent_version !== stageB.agent_version) {
      differences.agent_version = {
        a: stageA.agent_version,
        b: stageB.agent_version,
      };
    }

    if (stageA.prompt_version !== stageB.prompt_version) {
      differences.prompt_version = {
        a: stageA.prompt_version,
        b: stageB.prompt_version,
      };
    }

    if (stageA.model !== stageB.model) {
      differences.model = {
        a: stageA.model,
        b: stageB.model,
      };
    }

    if (stageA.status !== stageB.status) {
      differences.status = {
        a: stageA.status,
        b: stageB.status,
      };
    }

    if (stageA.failure_version !== stageB.failure_version) {
      differences.failure_version = {
        a: stageA.failure_version ?? null,
        b: stageB.failure_version ?? null,
      };
    }

    if (Object.keys(differences).length > 0) {
      deltas.push({
        stageIndex: i,
        differences,
      });
    }
  }

  return {
    missionA,
    missionB,
    stageCountA: a.stages.length,
    stageCountB: b.stages.length,
    deltas,
  };
}
