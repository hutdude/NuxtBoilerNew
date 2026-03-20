import { getVersion } from "../db/queries/version";

export default defineEventHandler(async () => {
  const version = await getVersion();
  return { version };
});

