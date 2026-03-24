/**
 * Validates plugin URLs against `audioloom_product_metadata`: row must exist and `visible` must be true.
 * The path segment after `/plugins/` is sent as `audioloom_product_id` (storefront id), not a separate `public_slug` column.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession();
  if (loggedIn.value) {
    return;
  }

  const productSlug = /^\/plugins\/([^/]+)/.exec(to.path)?.[1] ?? "";
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
      path: to.path,
      side: import.meta.server ? "server" : "client",
    });
  }

  try {
    await requestFetch("/api/plugins/product-availability", {
      query: { audioloomProductId: productSlug },
    });
    if (import.meta.dev) {
      console.log("[product-available] availability ok", { productSlug });
    }
  } catch (err: unknown) {
    const status = getFetchErrorStatus(err);
    if (import.meta.dev) {
      console.warn("[product-available] fetch failed", {
        productSlug,
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
