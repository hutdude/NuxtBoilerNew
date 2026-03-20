import { sql } from "../../db";

export type DbUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatarUrl: string | null;
};

export async function getUserByEmail(
  email: string,
): Promise<DbUser | null> {
  const rows = (await sql`
    SELECT
      id,
      email,
      name,
      password_hash as "passwordHash",
      avatar_url as "avatarUrl"
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `) as Array<Record<string, unknown>>;

  const row = rows[0];
  if (!row) {
    return null;
  }

  // Neon's SQL tag returns untyped rows; normalize + validate the fields we need.
  const id = row.id;
  const userEmail = row.email;
  const name = row.name;
  const passwordHash = row.passwordHash;
  const avatarUrl = row.avatarUrl;

  if (
    typeof id !== "string" ||
    typeof userEmail !== "string" ||
    typeof name !== "string" ||
    typeof passwordHash !== "string"
  ) {
    return null;
  }

  return {
    id,
    email: userEmail,
    name,
    passwordHash,
    avatarUrl: typeof avatarUrl === "string" ? avatarUrl : null,
  };
}

