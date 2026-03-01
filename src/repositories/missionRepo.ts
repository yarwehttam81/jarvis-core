import { db } from "./db";
import { MissionState } from "../models/mission";

export const missionRepo = {
  async create(mission: MissionState) {
    await db.query(
      `
      INSERT INTO mission_state (
        mission_id,
        channel_id,
        thread_ts,
        request_type,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        mission.mission_id,
        mission.channel_id,
        mission.thread_ts,
        mission.request_type,
        mission.status
      ]
    );
  },

  async updateStatus(
    mission_id: string,
    status: string
  ) {
    await db.query(
      `
      UPDATE mission_state
      SET status = $2,
          updated_at = NOW()
      WHERE mission_id = $1
      `,
      [mission_id, status]
    );
  },

  async getStagesByMissionId(mission_id: string) {
    const result = await db.query(
      `
      SELECT *
      FROM mission_stage_outputs
      WHERE mission_id = $1
      ORDER BY stage_index ASC
      `,
      [mission_id]
    );

    return result.rows;
  },

  async getStageByIndex(mission_id: string, stage_index: number) {
    const result = await db.query(
      `
      SELECT *
      FROM mission_stage_outputs
      WHERE mission_id = $1
        AND stage_index = $2
      `,
      [mission_id, stage_index]
    );

    return result.rows[0] || null;
  },

  // ✅ M4.1 — Transactional DB-assigned stage_index
  async createStage(params: {
    mission_id: string;
    stage_name: string;
    input_json: any;
  }) {
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Lock rows for this mission to prevent race conditions
      const indexResult = await client.query(
        `
        SELECT COALESCE(MAX(stage_index), 0) + 1 AS next_index
        FROM mission_stage_outputs
        WHERE mission_id = $1
        FOR UPDATE
        `,
        [params.mission_id]
      );

      const nextIndex = indexResult.rows[0].next_index;

      await client.query(
        `
        INSERT INTO mission_stage_outputs (
          mission_id,
          stage_name,
          stage_index,
          input_json,
          status
        )
        VALUES ($1, $2, $3, $4, 'running')
        `,
        [
          params.mission_id,
          params.stage_name,
          nextIndex,
          params.input_json
        ]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async completeStage(params: {
    mission_id: string;
    stage_index: number;
    output_json: any;
  }) {
    await db.query(
      `
      UPDATE mission_stage_outputs
      SET output_json = $3,
          status = 'completed',
          completed_at = NOW()
      WHERE mission_id = $1
        AND stage_index = $2
      `,
      [
        params.mission_id,
        params.stage_index,
        params.output_json
      ]
    );
  }
};
