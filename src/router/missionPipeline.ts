import { missionService } from "../services/missionService";
import { missionRepo } from "../repositories/missionRepo";
import { agentRegistry } from "../agents/registry/agent.registry";
import { AgentContext } from "../agents/interfaces/agent.types";

export const missionPipeline = {

  async run(mission_id: string) {

    const allStages = await missionRepo.getStagesByMissionId(mission_id);

    // 1️⃣ Resume running stage if exists
    const runningStage = allStages.find(s => s.status === "running");

    if (runningStage) {
      console.log(`Resuming Stage ${runningStage.stage_index}`);

      await executeStage(
        mission_id,
        runningStage.agent_name,
        runningStage.agent_version,
        runningStage.stage_index
      );

      return;
    }

    // 2️⃣ If no stages exist, start with orchestrator
    if (allStages.length === 0) {

      const orchestrator = agentRegistry.get("orchestrator");

      if (!orchestrator) {
        throw new Error("Orchestrator agent not found in registry");
      }

      await missionRepo.createStage({
        mission_id,
        agent_name: orchestrator.name,
        agent_version: orchestrator.version,
        stage_name: orchestrator.name,
        input_json: { mission_id }
      });

      return this.run(mission_id);
    }

    // 3️⃣ Otherwise, check last completed stage
    const lastCompleted = allStages
      .filter(s => s.status === "completed")
      .sort((a, b) => b.stage_index - a.stage_index)[0];

    if (!lastCompleted) {
      return;
    }

    const { next_agent } = lastCompleted.output_json || {};

    if (!next_agent) {
      console.log("Mission complete");
      return;
    }

    // 🔒 M5 — Registry validation BEFORE insertion
    const resolvedAgent = agentRegistry.get(next_agent);

    if (!resolvedAgent) {
      throw new Error(
        `Routing failed: agent "${next_agent}" not found in registry`
      );
    }

    await missionRepo.createStage({
      mission_id,
      agent_name: resolvedAgent.name,
      agent_version: resolvedAgent.version,
      stage_name: resolvedAgent.name,
      input_json: lastCompleted.output_json
    });

    return this.run(mission_id);
  }
};

async function executeStage(
  mission_id: string,
  agent_name: string,
  agent_version: string,
  stage_index: number
) {

  const context = await buildAgentContext(mission_id, stage_index);

  const agent = agentRegistry.get(agent_name);

  if (!agent) {
    throw new Error(`Agent "${agent_name}" not found during execution`);
  }

  // 🔒 Version enforcement check
  if (agent.version !== agent_version) {
    throw new Error(
      `Version mismatch for agent "${agent_name}". ` +
      `Ledger version: ${agent_version}, Registry version: ${agent.version}`
    );
  }

  const result = await agent.execute(context);

  await missionRepo.completeStage({
    mission_id,
    stage_index,
    output_json: {
      ...result.output,
      next_agent: result.next_agent
    }
  });

  await missionPipeline.run(mission_id);
}

async function buildAgentContext(
  mission_id: string,
  stage_index: number
): Promise<AgentContext & { input: unknown }> {

  const context = await missionService.buildMissionContext(mission_id);

  const missionInput = { mission_id: context.mission_id };

  const priorStageOutputs: Record<number, unknown> = {};

  for (const stage of context.stages) {
    if (stage.stage_index < stage_index && stage.output_json) {
      priorStageOutputs[stage.stage_index] = stage.output_json;
    }
  }

  const input =
    stage_index === 1
      ? missionInput
      : priorStageOutputs[stage_index - 1];

  if (stage_index > 1 && !input) {
    throw new Error(
      `Missing previous stage output for stage ${stage_index}`
    );
  }

  return {
    missionId: mission_id,
    stageIndex: stage_index,
    missionInput,
    priorStageOutputs,
    input
  };
}
