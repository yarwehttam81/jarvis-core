import { Request, Response } from "express";
import { computeDrift } from "../../behavioral/drift/computeDrift";

/**
 * IMPORTANT:
 * Replace this import with your actual ledger accessor.
 * It must be READ-ONLY.
 */
import { getStageOutputByExecutionId } from "../../ledger/readModel";

export async function getDriftComparison(req: Request, res: Response) {
  const { baselineExecutionId, comparisonExecutionId } = req.body;

  if (!baselineExecutionId || !comparisonExecutionId) {
    return res.status(400).json({
      error: "baselineExecutionId and comparisonExecutionId required"
    });
  }

  const baseline = await getStageOutputByExecutionId(
    baselineExecutionId
  );

  const comparison = await getStageOutputByExecutionId(
    comparisonExecutionId
  );

  if (!baseline || !comparison) {
    return res.status(404).json({
      error: "One or both executionIds not found"
    });
  }

  try {
    const driftResult = computeDrift(baseline, comparison);

    return res.json(driftResult);
  } catch (err) {
    return res.status(400).json({
      error: "Deterministic drift computation failure",
      message: err instanceof Error ? err.message : "Unknown error"
    });
  }
}
