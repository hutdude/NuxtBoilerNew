/**
 * Client-only AudioLoom storefront SDK: wait for the script (see plugins/audioloom.client.ts), then call setup().
 */

import type { AudioloomProduct } from "../../types/audioloom-product";

function defaultStoreUi(): Record<string, unknown> {
  return {
    toolbar: {
      enabled: false,
      location: "top-right",
    },
    theme: {
      dark: false,
      colors: {
        primary: "#687E5A",
      },
      fonts: {
        heading: "Outfit",
        body: "Outfit",
      },
      corners: "round",
      buttons: "light",
    },
    auth: {
      signIn: {
        enabled: true,
        hint: "undefined",
      },
    },
  };
}

function mergeStoreUi(
  base: Record<string, unknown>,
  override?: Record<string, unknown>,
): Record<string, unknown> {
  if (!override) {
    return base;
  }
  return {
    ...base,
    ...override,
    toolbar: {
      ...(base.toolbar as object),
      ...(override.toolbar as object),
    },
    theme: {
      ...(base.theme as object),
      ...(override.theme as object),
    },
    auth: {
      ...(base.auth as object),
      ...(override.auth as object),
    },
  };
}

export function useAudioloom() {
  const { audioloom } = useRuntimeConfig().public;

  const setupComplete = useState("audioloom-setup-complete", () => false);

  /** Shared catalog snapshot; updated from the SDK via `refreshProducts` / `waitForProducts`. */
  const productsState = useState<AudioloomProduct[]>(
    "audioloom-products",
    () => [],
  );

  const products = computed(() => productsState.value);

  async function whenReady(timeoutMs = 15000): Promise<void> {
    if (import.meta.server) {
      return;
    }
    const start = Date.now();
    while (typeof window !== "undefined" && !window.Audioloom) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(
          "AudioLoom SDK did not load in time (check script / network).",
        );
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
  }

  function getSdk(): typeof window.Audioloom | undefined {
    if (import.meta.server) {
      return undefined;
    }
    return typeof window !== "undefined" ? window.Audioloom : undefined;
  }

  function getProducts(): unknown[] | undefined {
    return getSdk()?.getProducts();
  }

  /** Pull the latest list from `window.Audioloom.getProducts()` into `products`. */
  function refreshProducts(): void {
    if (import.meta.server) {
      return;
    }
    const list = getProducts();
    productsState.value = (list ?? []) as AudioloomProduct[];
  }

  function getProduct(idOrSlug: string): AudioloomProduct | undefined {
    return productsState.value.find(
      (p) =>
        p.id === idOrSlug ||
        String((p as Record<string, unknown>).slug ?? "") === idOrSlug,
    );
  }

  /**
   * Resolves when `getProducts()` returns a non-empty array, or after timeout (then returns current list, maybe empty).
   * Always syncs into `products`.
   */
  async function waitForProducts(options?: {
    timeoutMs?: number;
    pollMs?: number;
  }): Promise<AudioloomProduct[]> {
    if (import.meta.server) {
      return [];
    }
    const timeoutMs = options?.timeoutMs ?? 15000;
    const pollMs = options?.pollMs ?? 100;
    const start = Date.now();
    for (;;) {
      const list = getProducts();
      if (list && list.length > 0) {
        refreshProducts();
        return productsState.value;
      }
      if (Date.now() - start > timeoutMs) {
        refreshProducts();
        return productsState.value;
      }
      await new Promise<void>((r) => setTimeout(r, pollMs));
    }
  }

  /**
   * Call once after the SDK script has loaded. Identity defaults to runtimeConfig.public.audioloom.
   * Pass `ui` to override toolbar/theme/auth (shallow merge per section).
   */
  async function setup(options?: {
    identity?: Partial<{ clientId: string; creatorId: string }>;
    ui?: Record<string, unknown>;
  }): Promise<void> {
    if (import.meta.server) {
      return;
    }
    if (setupComplete.value) {
      return;
    }

    await whenReady();

    const clientId = options?.identity?.clientId ?? audioloom.clientId;
    const creatorId = options?.identity?.creatorId ?? audioloom.creatorId;

    if (!clientId || !creatorId) {
      throw new Error(
        "useAudioloom.setup(): set public.audioloom.clientId and creatorId (e.g. NUXT_PUBLIC_AUDIOLOOM_CLIENT_ID / NUXT_PUBLIC_AUDIOLOOM_CREATOR_ID).",
      );
    }

    const ui = mergeStoreUi(defaultStoreUi(), options?.ui);
    window.Audioloom.setup({ clientId, creatorId }, ui);
    setupComplete.value = true;
    refreshProducts();
  }

  return {
    /** `true` after `setup()` has run (`Audioloom.setup` called). Not the same as catalog loaded — use `waitForProducts` for that. */
    setupComplete: readonly(setupComplete),
    /** Reactive catalog; kept in sync via `refreshProducts`, `waitForProducts`, and `setup`. */
    products,
    whenReady,
    setup,
    getSdk,
    getProducts,
    refreshProducts,
    waitForProducts,
    getProduct,
  };
}
