import {
  handlePluginProductAvailabilityLookup,
  parseAudioloomProductIdFromQuery,
  parseStorefrontContextFromQuery,
} from "../../utils/plugin-product-availability";

/**
 * Public check: `slug` or `audioloomProductId` query must equal `audioloom_product_id`.
 * No row → 404. Row exists but `visible` is false → 404.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const storefrontContext = parseStorefrontContextFromQuery(query);
  const audioloomProductId = parseAudioloomProductIdFromQuery(query);
  if (!audioloomProductId) {
    if (import.meta.dev) {
      console.warn(
        "[product-availability] missing audioloomProductId or slug",
        {
          query,
        },
      );
    }
    throw createError({
      statusCode: 400,
      statusMessage: "Missing audioloomProductId or slug",
    });
  }

  await handlePluginProductAvailabilityLookup(
    audioloomProductId,
    "product-availability",
    { storefrontContext },
  );
  return { ok: true as const };
});
