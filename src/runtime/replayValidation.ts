import { StageRecord } from "./stageInsert"

export interface MissionSnapshot {
  missionId: string
  stages: StageRecord[]
}

export interface ReplayComparisonResult {
  missionId: string
  identical: boolean
  differences: string[]
}

export function snapshotMissionGraph(
  missionId: string,
  allStages: StageRecord[]
): MissionSnapshot {
  const missionStages = allStages
    .filter((s) => s.missionId === missionId)
    .sort((a, b) => a.stageIndex - b.stageIndex)

  return {
    missionId,
    stages: missionStages
  }
}

export function compareMissionSnapshots(
  snapshotA: MissionSnapshot,
  snapshotB: MissionSnapshot
): ReplayComparisonResult {
  const differences: string[] = []

  if (snapshotA.stages.length !== snapshotB.stages.length) {
    differences.push("Stage count mismatch")
  }

  const length = Math.min(
    snapshotA.stages.length,
    snapshotB.stages.length
  )

  for (let i = 0; i < length; i++) {
    const a = snapshotA.stages[i]
    const b = snapshotB.stages[i]

    if (a.stageIndex !== b.stageIndex) {
      differences.push(`StageIndex mismatch at position ${i}`)
    }

    if (a.agent_name !== b.agent_name) {
      differences.push(`Agent mismatch at stage ${a.stageIndex}`)
    }

    if (a.triggered_by_stage !== b.triggered_by_stage) {
      differences.push(
        `Parent mismatch at stage ${a.stageIndex}`
      )
    }

    if (a.branch_order !== b.branch_order) {
      differences.push(
        `Branch order mismatch at stage ${a.stageIndex}`
      )
    }

    if (a.status !== b.status) {
      differences.push(
        `Status mismatch at stage ${a.stageIndex}`
      )
    }
  }

  return {
    missionId: snapshotA.missionId,
    identical: differences.length === 0,
    differences
  }
}
