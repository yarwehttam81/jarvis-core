import express, { Request, Response } from "express";
import { missionService } from "./services/missionService";
import { missionPipeline } from "./router/missionPipeline";
import { RequestType } from "./models/mission";

const app = express();

app.use(express.json());

/**
 * Deterministic Slack-compatible ingress endpoint.
 *
 * Responsibilities:
 *  - Persist mission
 *  - Trigger pipeline
 *  - Nothing else
 *
 * No stage insertion.
 * No routing logic.
 * No hidden state.
 */
app.post("/slack/events", async (req: Request, res: Response) => {
  try {
    const { channel_id, thread_ts, request_type } = req.body;

    if (!channel_id || !thread_ts || !request_type) {
      return res.status(400).json({
        error: "Missing required fields: channel_id, thread_ts, request_type",
      });
    }

    // 1️⃣ Persist mission first (Invariant: Slack input persisted before execution)
    const mission = await missionService.createMission(
      channel_id,
      thread_ts,
      request_type as RequestType
    );

    // 2️⃣ Trigger deterministic ledger-driven execution
    await missionPipeline.run(mission.mission_id);

    return res.status(200).json({
      mission_id: mission.mission_id,
      status: "accepted",
    });
  } catch (error) {
    console.error("Slack ingress failure:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log(`JARVIS Core ingress listening on port ${PORT}`);
});
