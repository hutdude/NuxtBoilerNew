import { sql } from "../../db";

export async function getVersion(): Promise<string> {
  const [response] = await sql`SELECT version()`;
  const version = response?.version;

  if (typeof version !== "string") {
    throw new Error("Unexpected result from SELECT version()");
  }

  return version;
}

