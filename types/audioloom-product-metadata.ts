/**
 * Row shape for `audioloom_product_metadata` (shared by server queries and app types).
 * `audioloom_product_id` holds either a product id or a bundle id from the storefront (unique strings).
 */
export type AudioloomStorefrontKind = "product" | "bundle";

export type AudioloomProductMetadataRow = {
  audioloomProductId: string;
  kind: AudioloomStorefrontKind;
  visible: boolean;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
};

/** Body for `PATCH /api/admin/audioloom-product-metadata` — include at least one of `kind`, `visible`, `sortOrder` per item. */
export type AudioloomMetadataPatchItem = {
  audioloomProductId: string;
  kind?: AudioloomStorefrontKind;
  visible?: boolean;
  sortOrder?: number | null;
};

export type AudioloomMetadataPatchPayload =
  | AudioloomMetadataPatchItem
  | { items: AudioloomMetadataPatchItem[] };

export type AudioloomMetadataPatchResult = {
  ok: true;
  count: number;
  rows: AudioloomProductMetadataRow[];
  notFoundIds: string[];
};

/** Body for `POST /api/admin/audioloom-product-metadata` (upsert). */
export type AudioloomMetadataUpsertPayload = {
  audioloomProductId: string;
  kind?: AudioloomStorefrontKind;
  visible?: boolean;
  sortOrder?: number | null;
};

export type AudioloomMetadataUpsertResult = {
  ok: true;
  count: number;
  rows: AudioloomProductMetadataRow[];
};
