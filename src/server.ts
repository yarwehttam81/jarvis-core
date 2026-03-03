import express, { Request, Response } from "express";
import { missionService } from "./services/missionService";
import { missionPipeline } from "./router/missionPipeline";
import { RequestType } from "./models/mission";
import { inspectMission } from "./observability/missionInspector";
import { inspectAgent } from "./observability/agentInspector";
import { compareMissions } from "./observability/driftComparator";

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

/**
 * M14 — Deterministic Mission Inspection (Read-only)
 *
 * No mutation.
 * No pipeline invocation.
 * Pure ledger introspection.
 */
app.get("/observability/mission/:missionId", async (req: Request, res: Response) => {
  try {
    const { missionId } = req.params;

    if (!missionId) {
      return res.status(400).json({
        error: "Missing missionId",
      });
    }

    const inspection = await inspectMission(missionId);

    return res.status(200).json(inspection);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
});
/**
 * M14 — Deterministic Agent Contract Inspection (Read-only)
 *
 * No mutation.
 * No execution.
 * Pure registry introspection.
 */
app.get("/observability/agent/:agentName", (req: Request, res: Response) => {
  try {
    const { agentName } = req.params;

    if (!agentName) {
      return res.status(400).json({
        error: "Missing agentName",
      });
    }

    const inspection = inspectAgent(agentName);

    return res.status(200).json(inspection);
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
});
/**
 * M14 — Deterministic Drift Comparison (Read-only)
 *
 * No mutation.
 * No execution.
 * Pure ledger comparison.
 */
app.get(
  "/observability/drift/:missionA/:missionB",
  async (req: Request, res: Response) => {
    try {
      const { missionA, missionB } = req.params;

      if (!missionA || !missionB) {
        return res.status(400).json({
          error: "Both missionA and missionB are required",
        });
      }

      const comparison = await compareMissions(missionA, missionB);

      return res.status(200).json(comparison);
    } catch (error) {
      return res.status(500).json({
        error: (error as Error).message,
      });
    }
  }
);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  console.log(`JARVIS Core ingress listening on port ${PORT}`);
});
