/**
 * Loads the AudioLoom storefront SDK once on the client.
 * Cache-bust query params are applied per app bootstrap (full load / new tab).
 */
function buildAudioloomScriptSrc(base: string): string {
  const url = new URL(base)
  url.searchParams.set("v", String(Date.now()))
  url.searchParams.set("_cb", Math.random().toString(36).substring(2, 11))
  return url.toString()
}

export default defineNuxtPlugin(() => {
  const { audioloom } = useRuntimeConfig().public
  const base = audioloom.scriptSrc
  const src = buildAudioloomScriptSrc(base)

  useHead({
    script: [{ src, type: "module" }],
  })
})
