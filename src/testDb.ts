import { db } from "./repositories/db";

async function test() {
  const result = await db.query("SELECT NOW()");
  console.log("DB Connected. Server time:", result.rows[0]);
  process.exit(0);
}

test();
