import { v4 as uuidv4 } from "uuid";
import { missionRepo } from "./repositories/missionRepo";

async function test() {
  const mission = {
    mission_id: uuidv4(),
    channel_id: "test_channel",
    thread_ts: Date.now().toString(),
    request_type: "build" as const,
    status: "initialized" as const
  };

  await missionRepo.create(mission);

  console.log("Mission inserted:", mission.mission_id);
  process.exit(0);
}

test();
