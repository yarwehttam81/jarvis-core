import { v4 as uuidv4 } from "uuid";
import { missionRepo } from "../repositories/missionRepo";
import { MissionState, RequestType, MissionStatus } from "../models/mission";

export const missionService = {
  async createMission(
    channel_id: string,
    thread_ts: string,
    request_type: RequestType
  ): Promise<MissionState> {

    const mission: MissionState = {
      mission_id: uuidv4(),
      channel_id,
      thread_ts,
      request_type,
      status: "initialized"
    };

    await missionRepo.create(mission);

    return mission;
  },

  async updateStatus(
    mission_id: string,
    status: MissionStatus
  ) {
    await missionRepo.updateStatus(mission_id, status);
  },
  async buildMissionContext(mission_id: string) {
    const stageRecords = await missionRepo.getStagesByMissionId(mission_id);

    const completedStages = stageRecords
      .filter((s: any) => s.status === "completed")
      .sort((a: any, b: any) => a.stage_index - b.stage_index);

    return {
      mission_id,
      stages: completedStages.map((s: any) => ({
        stage_name: s.stage_name,
        stage_index: s.stage_index,
        output: s.output_json
      }))
    };
  },
};
