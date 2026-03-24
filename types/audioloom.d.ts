export {}

/** Minimal storefront SDK surface we use; extend as needed. */
declare global {
  interface Window {
    Audioloom: AudioloomStorefrontSdk
  }
}

interface AudioloomStorefrontSdk {
  setup: (
    identity: { clientId: string, creatorId: string },
    options: Record<string, unknown>
  ) => void
  on: (event: string, handler: (payload: unknown) => void) => void
  getProducts: () => unknown[]
  getBundles: () => unknown[]
  view_cart: () => void
  view_account: () => void
}
