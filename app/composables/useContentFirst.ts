/**
 * Nuxt Content can race during dev: the first queries may run before the local
 * SQLite dump is imported ("no such table: _content_*"). Retrying fixes the
 * intermittent 404 on content-driven pages.
 */
const RETRY_DELAYS_MS = [0, 50, 150, 300, 500]

function isRetryableContentError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  return (
    msg.includes("no such table")
    || msg.includes("SQLITE_ERROR")
    || msg.includes("database is locked")
  )
}

export async function queryContentFirstByPath(path: string) {
  let lastError: unknown
  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    const delay = RETRY_DELAYS_MS[i]!
    if (delay) {
      await new Promise((r) => setTimeout(r, delay))
    }
    try {
      return await queryCollection("content").path(path).first()
    }
    catch (e) {
      lastError = e
      if (!isRetryableContentError(e)) {
        throw e
      }
      if (i === RETRY_DELAYS_MS.length - 1) {
        throw e
      }
    }
  }
  throw lastError
}
