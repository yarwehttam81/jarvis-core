import { v4 as uuidv4 } from "uuid";
import { missionRepo } from "./repositories/missionRepo";
import { missionPipeline } from "./router/missionPipeline";

async function test() {
  const missionId = uuidv4();

  console.log("Creating new mission:", missionId);

await missionRepo.create({
  mission_id: missionId,
  channel_id: "test_channel",
  thread_ts: "test_thread",
  request_type: "strategy",
  status: "initialized"
});
  await missionPipeline.run(missionId);

  console.log("Mission execution complete:", missionId);
}

test().catch(err => {
  console.error("Pipeline Error:", err);
  process.exit(1);
});
