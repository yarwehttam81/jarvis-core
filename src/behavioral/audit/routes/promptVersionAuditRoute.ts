import { Router } from "express";
import { computePromptVersionAudit } from "../engine/computePromptVersionAudit";
import { PromptVersionAuditResultSchema } from "../schemas/PromptVersionAuditSchema";

/**
 * Read-only Prompt Version Audit Route
 * Ledger-derived truth only
 * No mutation
 */
export function createPromptVersionAuditRoute(
  getMissionStageOutputs: () => Promise<Array<{
    mission_id: string;
    stage_index: number;
    agent_name: string;
    agent_version: string;
    prompt_version: string;
    model: string;
  }>>
): Router {
  const router = Router();

  router.get("/behavioral/audit/prompt-versions", async (_req, res) => {
    try {
      const missionStageOutputs = await getMissionStageOutputs();

      const auditResult = computePromptVersionAudit(missionStageOutputs);

      // Defensive validation before response emission
      const validated = PromptVersionAuditResultSchema.parse(auditResult);

      return res.status(200).json(validated);
    } catch (error) {
      return res.status(500).json({
        audit_version: "v1",
        error: "PROMPT_VERSION_AUDIT_FAILURE"
      });
    }
  });

  return router;
}
