import { agentRegistry } from "../registry/agentRegistry"
import {
  insertNextStage,
  getStagesByParent,
  updateStageStatus,
  getStageByIndex
} from "./stageInsert"
import { AgentContext } from "../types/AgentContext"

export async function handleStageCompletion(
  context: AgentContext,
  currentAgent: { agent_name: string }
) {
  const contract = agentRegistry[currentAgent.agent_name]

  if (!contract) {
    throw new Error("Agent contract not found in registry")
  }

  // 1️⃣ Mark current stage as success
  await updateStageStatus(
    context.missionId,
    context.stageIndex,
    "success"
  )

  // 2️⃣ If this stage declares parallel branches, expand them
  if (contract.parallel_branches && contract.parallel_branches.length > 0) {
    const branchGroup = contract.parallel_branches[0]

    for (let i = 0; i < branchGroup.agents.length; i++) {
      await insertNextStage({
        missionId: context.missionId,
        agent_name: branchGroup.agents[i],
        triggered_by_stage: context.stageIndex,
        branch_order: i
      })
    }

    return
  }

  // 3️⃣ Load current stage record
  const currentStage = await getStageByIndex(
    context.missionId,
    context.stageIndex
  )

  const parentStageIndex = currentStage.triggered_by_stage

  // If no parent, this is not a branch child
  if (parentStageIndex === undefined) {
    for (const nextAgent of contract.allowed_next_agents) {
      await insertNextStage({
        missionId: context.missionId,
        agent_name: nextAgent,
        triggered_by_stage: context.stageIndex
      })
    }
    return
  }

  // 4️⃣ Load all siblings (branch children)
  const siblings = await getStagesByParent(
    context.missionId,
    parentStageIndex
  )

  // 5️⃣ Load parent stage
  const parentStage = await getStageByIndex(
    context.missionId,
    parentStageIndex
  )

  const parentContract =
    agentRegistry[parentStage.agent_name]

  if (
    !parentContract ||
    !parentContract.parallel_branches ||
    parentContract.parallel_branches.length === 0
  ) {
    return
  }

  const branchGroup = parentContract.parallel_branches[0]

  // 6️⃣ Ensure all branches completed
  if (siblings.length !== branchGroup.agents.length) {
    return
  }

  const allSucceeded = siblings.every(
    (stage) => stage.status === "success"
  )

  if (!allSucceeded) {
    return
  }

  // 7️⃣ Insert merge stage deterministically
  await insertNextStage({
    missionId: context.missionId,
    agent_name: branchGroup.merge_agent,
    triggered_by_stage: parentStageIndex
  })
}
