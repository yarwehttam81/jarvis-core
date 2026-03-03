import { db } from "../db";
import { missionStages } from "../db/schema";
import { eq } from "drizzle-orm";

export interface MissionInspectionResult {
  missionId: string;
  stages: Array<{
    stageIndex: number;
    agent_name: string;
    agent_version: string;
    prompt_version: string;
    model: string;
    status: string;
    failure_version?: string | null;
  }>;
}

export async function inspectMission(
  missionId: string
): Promise<MissionInspectionResult> {
  const stages = await db
    .select()
    .from(missionStages)
    .where(eq(missionStages.missionId, missionId))
    .orderBy(missionStages.stageIndex);

  return {
    missionId,
    stages: stages.map((stage) => ({
      stageIndex: stage.stageIndex,
      agent_name: stage.agentName,
      agent_version: stage.agentVersion,
      prompt_version: stage.promptVersion,
      model: stage.model,
      status: stage.status,
      failure_version: stage.failureVersion ?? null,
    })),
  };
}
