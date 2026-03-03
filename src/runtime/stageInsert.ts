export type StageStatus = "pending" | "success" | "failure"

export interface StageRecord {
  missionId: string
  stageIndex: number
  agent_name: string
  triggered_by_stage?: number
  status: StageStatus
  branch_order?: number
}

// --- Deterministic In-Memory Ledger ---

const stageStore: StageRecord[] = []

function getNextStageIndex(missionId: string): number {
  const missionStages = stageStore
    .filter((s) => s.missionId === missionId)
    .sort((a, b) => a.stageIndex - b.stageIndex)

  if (missionStages.length === 0) {
    return 1
  }

  return missionStages[missionStages.length - 1].stageIndex + 1
}

export interface InsertNextStageParams {
  missionId: string
  agent_name: string
  triggered_by_stage: number
  branch_order?: number
}

export async function insertNextStage(
  params: InsertNextStageParams
): Promise<StageRecord> {
  const stageIndex = getNextStageIndex(params.missionId)

  const newStage: StageRecord = {
    missionId: params.missionId,
    stageIndex,
    agent_name: params.agent_name,
    triggered_by_stage: params.triggered_by_stage,
    status: "pending",
    branch_order: params.branch_order
  }

  stageStore.push(newStage)

  return newStage
}

// --- Ledger Query Support ---

export async function getStagesByParent(
  missionId: string,
  parentStage: number
): Promise<StageRecord[]> {
  return stageStore
    .filter(
      (s) =>
        s.missionId === missionId &&
        s.triggered_by_stage === parentStage
    )
    .sort((a, b) => {
      if (a.branch_order !== undefined && b.branch_order !== undefined) {
        return a.branch_order - b.branch_order
      }
      return a.stageIndex - b.stageIndex
    })
}

export async function updateStageStatus(
  missionId: string,
  stageIndex: number,
  status: StageStatus
): Promise<StageRecord> {
  const stage = stageStore.find(
    (s) => s.missionId === missionId && s.stageIndex === stageIndex
  )

  if (!stage) {
    throw new Error("Stage not found for status update")
  }

  stage.status = status

  return stage
}

export async function getStageByIndex(
  missionId: string,
  stageIndex: number
): Promise<StageRecord> {
  const stage = stageStore.find(
    (s) => s.missionId === missionId && s.stageIndex === stageIndex
  )

  if (!stage) {
    throw new Error("Stage not found")
  }

  return stage
}
