/**
 * Validates `/plugins/:id` and `/samples/:id` against `audioloom_product_metadata`.
 * The path segment is the storefront `audioloom_product_id`.
 * — `/plugins/`: bundles or products with `product_category = plugin`.
 * — `/samples/`: products with `product_category = sample-pack` only.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession();
  if (loggedIn.value) {
    return;
  }

  const pluginMatch = /^\/plugins\/([^/]+)/.exec(to.path);
  const sampleMatch = /^\/samples\/([^/]+)/.exec(to.path);
  const productSlug = pluginMatch?.[1] ?? sampleMatch?.[1] ?? "";
  const storefrontContext = sampleMatch ? "samples" : "plugins";

  if (!productSlug) {
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  const requestFetch = import.meta.server ? useRequestFetch() : $fetch;

  if (import.meta.dev) {
    console.log("[product-available] middleware check", {
      productSlug,
      storefrontContext,
      path: to.path,
      side: import.meta.server ? "server" : "client",
    });
  }

  try {
    await requestFetch("/api/plugins/product-availability", {
      query: {
        audioloomProductId: productSlug,
        storefrontContext,
      },
    });
    if (import.meta.dev) {
      console.log("[product-available] availability ok", {
        productSlug,
        storefrontContext,
      });
    }
  } catch (err: unknown) {
    const status = getFetchErrorStatus(err);
    if (import.meta.dev) {
      console.warn("[product-available] fetch failed", {
        productSlug,
        storefrontContext,
        status,
        err,
        data:
          typeof err === "object" && err !== null && "data" in err
            ? (err as { data?: unknown }).data
            : undefined,
      });
    }
    if (status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
      });
    }
    throw err;
  }
});

function getFetchErrorStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) {
    return undefined;
  }
  const o = err as { statusCode?: number; status?: number };
  return o.statusCode ?? o.status;
}
