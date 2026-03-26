import {
  handlePluginProductAvailabilityLookup,
  parseAudioloomProductIdFromQuery,
  parseStorefrontContextFromQuery,
} from "../utils/plugin-product-availability";

/**
 * Alias for `/api/plugins/product-availability` — queries `audioloom_product_id` only (no `public_slug`).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const storefrontContext = parseStorefrontContextFromQuery(query);
  const audioloomProductId = parseAudioloomProductIdFromQuery(query);
  if (!audioloomProductId) {
    if (import.meta.dev) {
      console.warn("[plugin-visibility] missing audioloomProductId or slug", {
        query,
      });
    }
    throw createError({
      statusCode: 400,
      statusMessage: "Missing audioloomProductId or slug",
    });
  }

  await handlePluginProductAvailabilityLookup(
    audioloomProductId,
    "plugin-visibility",
    { storefrontContext },
  );
  return { ok: true as const };
});
