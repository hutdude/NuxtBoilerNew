import { getAudioloomProductMetadataByAudioloomProductId } from "../db/queries/audioloom-product-metadata";

/**
 * `slug` query param is the URL segment name; value must still be the storefront `audioloom_product_id`.
 */
export async function handlePluginProductAvailabilityLookup(
  audioloomProductId: string,
  logLabel: string,
): Promise<void> {
  const row
    = await getAudioloomProductMetadataByAudioloomProductId(audioloomProductId);

  if (import.meta.dev) {
    console.log(`[${logLabel}] lookup`, {
      audioloomProductId,
      row: row
        ? {
            audioloomProductId: row.audioloomProductId,
            visible: row.visible,
            kind: row.kind,
          }
        : null,
    });
  }

  if (!row) {
    if (import.meta.dev) {
      console.warn(
        `[${logLabel}] 404: no row for audioloom_product_id`,
        { audioloomProductId },
      );
    }
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }
  if (!row.visible) {
    if (import.meta.dev) {
      console.warn(`[${logLabel}] 404: visible=false`, {
        audioloomProductId: row.audioloomProductId,
      });
    }
    throw createError({
      statusCode: 404,
      statusMessage: "Product not found",
    });
  }

  if (import.meta.dev) {
    console.log(`[${logLabel}] ok`, { audioloomProductId });
  }
}

export function parseAudioloomProductIdFromQuery(query: Record<string, unknown>): string {
  const fromId = query.audioloomProductId;
  if (typeof fromId === "string" && fromId.trim()) {
    return fromId.trim();
  }
  const fromSlug = query.slug;
  if (typeof fromSlug === "string" && fromSlug.trim()) {
    return fromSlug.trim();
  }
  return "";
}
