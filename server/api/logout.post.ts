export default defineEventHandler(async (event) => {
  await clearUserSession(event);
  await clearStudioUserSession(event);
  return { ok: true };
});
