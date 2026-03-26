import type {
  AudioloomProductCategory,
  AudioloomProductMetadataRow,
  AudioloomStorefrontKind,
} from "../../../types/audioloom-product-metadata";
import { sql } from "../../db";

export type { AudioloomProductMetadataRow };

/** Neon/pg often return `timestamptz` as `Date`; JSON paths use ISO strings. */
function asIsoTimestamp(v: unknown): string | null {
  if (typeof v === "string") {
    return v;
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString();
  }
  return null;
}

function normalizeRow(
  row: Record<string, unknown>,
): AudioloomProductMetadataRow | null {
  const audioloomProductId = row.audioloomProductId;
  const kind = row.kind;
  const rawPc = row.productCategory;
  const visible = row.visible;
  const sortOrder = row.sortOrder;
  const createdAt = asIsoTimestamp(row.createdAt);
  const updatedAt = asIsoTimestamp(row.updatedAt);

  let productCategory: AudioloomProductCategory | null;
  if (rawPc === null || rawPc === undefined) {
    productCategory = null;
  } else if (rawPc === "sample-pack" || rawPc === "plugin") {
    productCategory = rawPc;
  } else {
    return null;
  }

  if (kind === "bundle" && productCategory !== null) {
    return null;
  }
  if (kind === "product" && productCategory === null) {
    return null;
  }

  if (
    typeof audioloomProductId !== "string" ||
    (kind !== "product" && kind !== "bundle") ||
    typeof visible !== "boolean" ||
    (sortOrder !== null && typeof sortOrder !== "number") ||
    createdAt === null ||
    updatedAt === null
  ) {
    return null;
  }

  return {
    audioloomProductId,
    kind,
    productCategory,
    visible,
    sortOrder:
      sortOrder === null || typeof sortOrder === "number" ? sortOrder : null,
    createdAt,
    updatedAt,
  };
}

export type UpsertProductMetadataInput = {
  audioloomProductId: string;
  visible?: boolean;
  sortOrder?: number | null;
  kind?: AudioloomStorefrontKind;
  productCategory?: AudioloomProductCategory;
};

/** Only provided fields are written; row must already exist. */
export type PatchProductMetadataInput = {
  audioloomProductId: string;
  kind?: AudioloomStorefrontKind;
  productCategory?: AudioloomProductCategory;
  visible?: boolean;
  sortOrder?: number | null;
};

function hasPatchFields(input: PatchProductMetadataInput): boolean {
  return (
    input.kind !== undefined ||
    input.productCategory !== undefined ||
    input.visible !== undefined ||
    input.sortOrder !== undefined
  );
}

/**
 * Partial update by id. Returns `null` if no row matched (unknown id).
 */
export async function patchAudioloomProductMetadata(
  input: PatchProductMetadataInput,
): Promise<AudioloomProductMetadataRow | null> {
  if (!hasPatchFields(input)) {
    const rows = await listAudioloomProductMetadataByIds([
      input.audioloomProductId,
    ]);
    return rows[0] ?? null;
  }

  const params: unknown[] = [];
  const setParts: string[] = [];
  let n = 1;

  if (input.kind !== undefined) {
    setParts.push(`kind = $${n++}`);
    params.push(input.kind);
  }
  if (input.kind === "bundle") {
    setParts.push("product_category = NULL");
  } else if (input.productCategory !== undefined) {
    setParts.push(`product_category = $${n++}`);
    params.push(input.productCategory);
  } else if (input.kind === "product") {
    setParts.push("product_category = COALESCE(product_category, 'plugin')");
  }
  if (input.visible !== undefined) {
    setParts.push(`visible = $${n++}`);
    params.push(input.visible);
  }
  if (input.sortOrder !== undefined) {
    setParts.push(`sort_order = $${n++}`);
    params.push(input.sortOrder);
  }

  setParts.push("updated_at = now()");
  const whereParam = n;
  params.push(input.audioloomProductId);

  const query = `
    UPDATE audioloom_product_metadata
    SET ${setParts.join(", ")}
    WHERE audioloom_product_id = $${whereParam}
    RETURNING
      audioloom_product_id AS "audioloomProductId",
      kind,
      product_category AS "productCategory",
      visible,
      sort_order AS "sortOrder",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const rows = (await sql.query(query, params)) as Array<
    Record<string, unknown>
  >;
  return normalizeRow(rows[0] ?? {}) ?? null;
}

export async function patchAudioloomProductMetadataMany(
  inputs: PatchProductMetadataInput[],
): Promise<{ rows: AudioloomProductMetadataRow[]; notFoundIds: string[] }> {
  const rows: AudioloomProductMetadataRow[] = [];
  const notFoundIds: string[] = [];
  for (const input of inputs) {
    const row = await patchAudioloomProductMetadata(input);
    if (row) {
      rows.push(row);
    } else {
      notFoundIds.push(input.audioloomProductId);
    }
  }
  return { rows, notFoundIds };
}

export async function upsertAudioloomProductMetadata(
  input: UpsertProductMetadataInput,
): Promise<AudioloomProductMetadataRow | null> {
  const visible = input.visible ?? false;
  const sortOrder = input.sortOrder === undefined ? null : input.sortOrder;
  const kind = input.kind ?? "product";
  const productCategory: AudioloomProductCategory | null =
    kind === "bundle"
      ? null
      : (input.productCategory ?? "plugin");

  const rows = (await sql`
    INSERT INTO audioloom_product_metadata (audioloom_product_id, visible, sort_order, kind, product_category, updated_at)
    VALUES (
      ${input.audioloomProductId},
      ${visible},
      ${sortOrder},
      ${kind},
      ${productCategory},
      now()
    )
    ON CONFLICT (audioloom_product_id) DO UPDATE SET
      visible = EXCLUDED.visible,
      sort_order = EXCLUDED.sort_order,
      kind = EXCLUDED.kind,
      product_category = EXCLUDED.product_category,
      updated_at = now()
    RETURNING
      audioloom_product_id AS "audioloomProductId",
      kind,
      product_category AS "productCategory",
      visible,
      sort_order AS "sortOrder",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `) as Array<Record<string, unknown>>;

  return normalizeRow(rows[0] ?? {}) ?? null;
}

export async function upsertAudioloomProductMetadataMany(
  inputs: UpsertProductMetadataInput[],
): Promise<AudioloomProductMetadataRow[]> {
  const out: AudioloomProductMetadataRow[] = [];
  for (const input of inputs) {
    const row = await upsertAudioloomProductMetadata(input);
    if (row) {
      out.push(row);
    }
  }
  return out;
}

/**
 * Insert default row if missing (used when syncing storefront ids). Does not overwrite existing rows.
 */
export async function insertAudioloomProductMetadataIfMissing(
  audioloomProductId: string,
  kind: AudioloomStorefrontKind,
): Promise<void> {
  const productCategory = kind === "bundle" ? null : "plugin";
  await sql`
    INSERT INTO audioloom_product_metadata (audioloom_product_id, visible, sort_order, kind, product_category, updated_at)
    VALUES (${audioloomProductId}, false, null, ${kind}, ${productCategory}, now())
    ON CONFLICT (audioloom_product_id) DO NOTHING
  `;
}

export async function ensureAudioloomProductMetadataRows(input: {
  productIds: string[];
  bundleIds: string[];
}): Promise<void> {
  const bundleSet = new Set(input.bundleIds);
  const productSet = new Set(input.productIds);
  const allIds = [...new Set([...productSet, ...bundleSet])];
  if (allIds.length === 0) {
    return;
  }

  const existing = await listAudioloomProductMetadataByIds(allIds);
  const have = new Set(existing.map((r) => r.audioloomProductId));

  for (const id of allIds.sort()) {
    if (have.has(id)) {
      continue;
    }
    const kind: AudioloomStorefrontKind = bundleSet.has(id)
      ? "bundle"
      : "product";
    await insertAudioloomProductMetadataIfMissing(id, kind);
    have.add(id);
  }
}

export async function listAudioloomProductMetadata(): Promise<
  AudioloomProductMetadataRow[]
> {
  const rows = (await sql`
    SELECT
      audioloom_product_id AS "audioloomProductId",
      kind,
      product_category AS "productCategory",
      visible,
      sort_order AS "sortOrder",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM audioloom_product_metadata
    ORDER BY sort_order NULLS LAST, audioloom_product_id ASC
  `) as Array<Record<string, unknown>>;

  return rows
    .map((r) => normalizeRow(r))
    .filter((r): r is AudioloomProductMetadataRow => r !== null);
}

export async function listAudioloomProductMetadataByIds(
  ids: string[],
): Promise<AudioloomProductMetadataRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const rows = (await sql`
    SELECT
      audioloom_product_id AS "audioloomProductId",
      kind,
      product_category AS "productCategory",
      visible,
      sort_order AS "sortOrder",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM audioloom_product_metadata
    WHERE audioloom_product_id = ANY(${ids})
    ORDER BY sort_order NULLS LAST, audioloom_product_id ASC
  `) as Array<Record<string, unknown>>;

  return rows
    .map((r) => normalizeRow(r))
    .filter((r): r is AudioloomProductMetadataRow => r !== null);
}

/**
 * Single row keyed by `audioloom_product_id` (storefront product or bundle id). No `public_slug` column.
 */
export async function getAudioloomProductMetadataByAudioloomProductId(
  audioloomProductId: string,
): Promise<AudioloomProductMetadataRow | null> {
  if (!audioloomProductId) {
    return null;
  }
  const rows = (await sql`
    SELECT
      audioloom_product_id AS "audioloomProductId",
      kind,
      product_category AS "productCategory",
      visible,
      sort_order AS "sortOrder",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM audioloom_product_metadata
    WHERE audioloom_product_id = ${audioloomProductId}
    LIMIT 1
  `) as Array<Record<string, unknown>>;

  return normalizeRow(rows[0] ?? {}) ?? null;
}
