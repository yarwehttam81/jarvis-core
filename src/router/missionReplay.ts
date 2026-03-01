import { missionRepo } from "../repositories/missionRepo";

type StageRecord = {
  mission_id: string;
  stage_name: string;
  stage_index: number;
  agent_name: string;
  agent_version: string;
  status: string;
  input_json: any;
  output_json: any;
};

export const missionReplay = {
  async replay(mission_id: string) {
    const rawStages: StageRecord[] =
      await missionRepo.getStagesByMissionId(mission_id);

    if (rawStages.length === 0) {
      throw new Error("Replay failed: no stages found for mission");
    }

    const stages = [...rawStages].sort(
      (a, b) => a.stage_index - b.stage_index
    );

    validateStageIndexIntegrity(stages);
    validateAllStagesCompleted(stages);
    validateAgentIdentityIntegrity(stages);
    validateNextAgentChainStrict(stages);

    return buildCanonicalReplayGraph(stages);
  }
};

function validateStageIndexIntegrity(stages: StageRecord[]) {
  const seen = new Set<number>();

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];

    if (seen.has(stage.stage_index)) {
      throw new Error(
        `Replay integrity failure: duplicate stage_index ${stage.stage_index}`
      );
    }

    seen.add(stage.stage_index);

    const expectedIndex = i + 1;

    if (stage.stage_index !== expectedIndex) {
      throw new Error(
        `Replay integrity failure: expected stage_index ${expectedIndex}, found ${stage.stage_index}`
      );
    }
  }

  if (stages[0].stage_index !== 1) {
    throw new Error(
      `Replay integrity failure: first stage_index must be 1`
    );
  }
}

function validateAllStagesCompleted(stages: StageRecord[]) {
  for (const stage of stages) {
    if (stage.status !== "completed") {
      throw new Error(
        `Replay integrity failure: stage ${stage.stage_index} is not completed`
      );
    }

    if (!stage.output_json) {
      throw new Error(
        `Replay integrity failure: stage ${stage.stage_index} missing output_json`
      );
    }
  }
}

function validateAgentIdentityIntegrity(stages: StageRecord[]) {
  for (const stage of stages) {
    if (!stage.agent_name || typeof stage.agent_name !== "string") {
      throw new Error(
        `Replay integrity failure: invalid agent_name at stage ${stage.stage_index}`
      );
    }

    if (!stage.agent_version || typeof stage.agent_version !== "string") {
      throw new Error(
        `Replay integrity failure: invalid agent_version at stage ${stage.stage_index}`
      );
    }

    if (stage.agent_name.trim().length === 0) {
      throw new Error(
        `Replay integrity failure: empty agent_name at stage ${stage.stage_index}`
      );
    }

    if (stage.agent_version.trim().length === 0) {
      throw new Error(
        `Replay integrity failure: empty agent_version at stage ${stage.stage_index}`
      );
    }
  }
}

function validateNextAgentChainStrict(stages: StageRecord[]) {
  for (let i = 0; i < stages.length; i++) {
    const current = stages[i];
    const isLast = i === stages.length - 1;

    const nextAgent = current.output_json?.next_agent;

    if (!isLast) {
      if (nextAgent === null || nextAgent === undefined) {
        throw new Error(
          `Replay integrity failure: non-terminal stage ${current.stage_index} has null next_agent`
        );
      }

      const next = stages[i + 1];

      if (next.agent_name !== nextAgent) {
        throw new Error(
          `Replay integrity failure: next_agent mismatch at stage ${current.stage_index}`
        );
      }
    } else {
      if (nextAgent !== null) {
        throw new Error(
          `Replay integrity failure: terminal stage must have next_agent = null`
        );
      }
    }
  }
}

function buildCanonicalReplayGraph(stages: StageRecord[]) {
  const canonicalStages = stages.map(s => {
    const stage = {
      stage_index: s.stage_index,
      agent_name: s.agent_name,
      agent_version: s.agent_version,
      output_json: deepClone(s.output_json)
    };

    return Object.freeze(stage);
  });

  const graph = {
    mission_id: stages[0].mission_id,
    stage_count: canonicalStages.length,
    stages: Object.freeze(canonicalStages)
  };

  return Object.freeze(graph);
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
