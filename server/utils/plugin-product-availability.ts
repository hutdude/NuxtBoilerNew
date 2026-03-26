import { getAudioloomProductMetadataByAudioloomProductId } from "../db/queries/audioloom-product-metadata";

/** Which public route is checking availability (`/plugins/...` vs `/samples/...`). */
export type StorefrontContext = "plugins" | "samples";

/**
 * `slug` query param is the URL segment name; value must still be the storefront `audioloom_product_id`.
 */
export async function handlePluginProductAvailabilityLookup(
  audioloomProductId: string,
  logLabel: string,
  options?: { storefrontContext?: StorefrontContext },
): Promise<void> {
  const storefrontContext: StorefrontContext = options?.storefrontContext
    ?? "plugins";

  const row
    = await getAudioloomProductMetadataByAudioloomProductId(audioloomProductId);

  if (import.meta.dev) {
    console.log(`[${logLabel}] lookup`, {
      audioloomProductId,
      storefrontContext,
      row: row
        ? {
            audioloomProductId: row.audioloomProductId,
            visible: row.visible,
            kind: row.kind,
            productCategory: row.productCategory,
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

  if (storefrontContext === "samples") {
    if (row.kind !== "product") {
      throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
      });
    }
    if (row.productCategory !== "sample-pack") {
      throw createError({
        statusCode: 404,
        statusMessage: "Product not found",
      });
    }
    if (import.meta.dev) {
      console.log(`[${logLabel}] ok (samples)`, { audioloomProductId });
    }
    return;
  }

  // storefrontContext === "plugins": bundles + plugin products only (not sample packs)
  if (row.kind === "bundle") {
    if (import.meta.dev) {
      console.log(`[${logLabel}] ok (bundle)`, { audioloomProductId });
    }
    return;
  }
  if (row.kind === "product" && row.productCategory === "plugin") {
    if (import.meta.dev) {
      console.log(`[${logLabel}] ok (plugin product)`, { audioloomProductId });
    }
    return;
  }

  if (import.meta.dev) {
    console.warn(`[${logLabel}] 404: wrong storefront for /plugins/`, {
      audioloomProductId,
      kind: row.kind,
      productCategory: row.productCategory,
    });
  }
  throw createError({
    statusCode: 404,
    statusMessage: "Product not found",
  });
}

export function parseStorefrontContextFromQuery(
  query: Record<string, unknown>,
): StorefrontContext {
  const raw = query.storefrontContext ?? query.context;
  if (raw === "samples") {
    return "samples";
  }
  return "plugins";
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
