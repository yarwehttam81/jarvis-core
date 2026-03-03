import { missionService } from "../services/missionService";
import { missionRepo } from "../repositories/missionRepo";
import { agentRegistry } from "../agents/registry/agent.registry";
import { AgentContext, AgentResult } from "../agents/interfaces/agent.types";

import { validateInputSchema } from "../behavioral/schemaValidator";
import { JarvisInputSchema } from "../agents/jarvis/input.schema";

import { validateOutput } from "../core/behavior/schemaValidator";
import { OrchestratorOutputSchema } from "../agents/runtime/orchestrator.output.schema";

import { FailureEnvelopeSchema } from "../behavioral/failureEnvelope.schema";
import {
  AgentContextSchema,
  deepFreeze
} from "../behavioral/schemas/AgentContextSchema";
export const missionPipeline = {
  async run(mission_id: string): Promise<void> {
    const allStages = await missionRepo.getStagesByMissionId(mission_id);

    const runningStage = allStages.find(s => s.status === "running");

    if (runningStage) {
      await executeStage(
        mission_id,
        runningStage.agent_name,
        runningStage.agent_version,
        runningStage.stage_index
      );
      return;
    }

    if (allStages.length === 0) {
      const orchestrator = agentRegistry.get("orchestrator");

      await missionRepo.createStage({
        mission_id,
        agent_name: orchestrator.name,
        agent_version: orchestrator.version,
        stage_name: orchestrator.name,
        input_json: { mission_id }
      });

      return this.run(mission_id);
    }

    const lastCompleted = allStages
      .filter(s => s.status === "completed")
      .sort((a, b) => b.stage_index - a.stage_index)[0];

    if (!lastCompleted) return;

    const next_agent = lastCompleted.output_json?.next_agent;

    if (!next_agent) return;

    const resolvedAgent = agentRegistry.get(next_agent);

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
  const contract = agentRegistry.getContract(agent_name);

  if (agent.version !== agent_version) {
    throw new Error(
      `Version mismatch for agent "${agent_name}". Ledger: ${agent_version}, Registry: ${agent.version}`
    );
  }

  async function persistFailure(
    error_code: string,
    error_details?: unknown
  ) {
    const failureEnvelope = {
      status: "failed" as const,
      error_code,
      error_details,
      agent_name,
      agent_version,
      stage_index,
      failure_version: "v1" as const
    };

    const parsed = FailureEnvelopeSchema.safeParse(failureEnvelope);

    if (!parsed.success) {
      throw new Error("FailureEnvelopeSchema validation failed");
    }

    await missionRepo.completeStage({
      mission_id,
      stage_index,
      output_json: parsed.data
    });
  }
  // ===============================
  // M13 — AgentContext Enforcement
  // ===============================

  const parsedContext = AgentContextSchema.safeParse(context);

  if (!parsedContext.success) {
    await persistFailure(
      "AGENT_CONTEXT_SCHEMA_VALIDATION_FAILED",
      parsedContext.error.flatten()
    );
    return;
  }

  const frozenContext = deepFreeze(parsedContext.data);
  if (agent_name === "orchestrator") {
    validateInputSchema(
      JarvisInputSchema,
      context.input,
      {
        agent_name,
        agent_version,
        mission_id,
        stage_id: stage_index.toString()
      }
    );
  }

const rawResult: AgentResult = await agent.execute(frozenContext);
  let finalResult: AgentResult = rawResult;

  if (agent_name === "orchestrator") {
    const validation = validateOutput(
      OrchestratorOutputSchema,
      rawResult
    );

    if (!validation.success) {
      await persistFailure(
        "OUTPUT_SCHEMA_VALIDATION_FAILED",
        validation.errors
      );
      return;
    }

    finalResult = validation.data;
  }

  if (!contract.allowed_models.includes(finalResult.model)) {
    await persistFailure(
      "MODEL_NOT_ALLOWED_BY_CONTRACT",
      { model: finalResult.model }
    );
    return;
  }

  if (
    finalResult.next_agent &&
    !contract.allowed_next_agents.includes(finalResult.next_agent)
  ) {
    await persistFailure(
      "NEXT_AGENT_NOT_ALLOWED_BY_CONTRACT",
      { next_agent: finalResult.next_agent }
    );
    return;
  }

  if (finalResult.prompt_version !== contract.prompt_version) {
    await persistFailure(
      "PROMPT_VERSION_MISMATCH",
      {
        expected: contract.prompt_version,
        received: finalResult.prompt_version
      }
    );
    return;
  }

  await missionRepo.completeStage({
    mission_id,
    stage_index,
    output_json: {
      status: finalResult.status,
      model: finalResult.model,
      prompt_version: finalResult.prompt_version,
      output: finalResult.output,
      next_agent: finalResult.next_agent
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
    if (stage.stage_index < stage_index && stage.output) {
      priorStageOutputs[stage.stage_index] = stage.output;
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
