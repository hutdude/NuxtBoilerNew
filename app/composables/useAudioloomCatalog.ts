import type {
  AudioloomMetadataPatchPayload,
  AudioloomMetadataPatchResult,
  AudioloomMetadataUpsertPayload,
  AudioloomMetadataUpsertResult,
  AudioloomProductMetadataRow,
} from "../../types/audioloom-product-metadata";
import type {
  MergedAudioloomBundle,
  MergedAudioloomProduct,
} from "../../types/audioloom-catalog";
import {
  mergeAudioloomBundleWithMetadata,
  mergeAudioloomProductWithMetadata,
  sortMergedOfferings,
  sortMergedStorefrontBySite,
} from "../utils/audioloom-catalog";

/**
 * AudioLoom SDK catalog + `audioloom_product_metadata` rows.
 * SDK data stays the source for commerce fields; DB adds site flags (visibility, sort).
 * Metadata ids are product ids **or** bundle ids (same `audioloom_product_id` column).
 */
export function useAudioloomCatalog() {
  const al = useAudioloom();

  const metadataById = useState<Record<string, AudioloomProductMetadataRow>>(
    "audioloom-products-metadata",
    () => ({}),
  );

  const metadataLoading = useState(
    "audioloom-products-metadata-loading",
    () => false,
  );
  const metadataError = useState<Error | null>(
    "audioloom-products-metadata-error",
    () => null,
  );

  /** True after `waitForProducts` + `waitForBundles` have finished (see `syncCatalog`). */
  const sdkCatalogHydrated = useState(
    "audioloom-sdk-catalog-hydrated",
    () => false,
  );
  /** True after `loadMetadata` has finished at least once (success or error). */
  const metadataInitialized = useState(
    "audioloom-metadata-initialized",
    () => false,
  );

  function storefrontMetadataIds(): string[] {
    const p = al.products.value.map((x) => x.id);
    const b = al.bundles.value.map((x) => x.id);
    return [...p, ...b];
  }

  async function loadMetadata(ids?: string[]): Promise<void> {
    if (import.meta.server) {
      return;
    }

    metadataLoading.value = true;
    metadataError.value = null;

    try {
      const targetIds = ids ?? storefrontMetadataIds();
      if (targetIds.length === 0) {
        metadataError.value = null;
        return;
      }

      const res = await $fetch<{ rows: AudioloomProductMetadataRow[] }>(
        "/api/audioloom-product-metadata",
        ids !== undefined
          ? { query: { ids: targetIds.join(",") } }
          : {
              query: {
                productIds: al.products.value.map((p) => p.id).join(","),
                bundleIds: al.bundles.value.map((b) => b.id).join(","),
              },
            },
      );
      const next: Record<string, AudioloomProductMetadataRow> = {};
      for (const row of res.rows) {
        next[row.audioloomProductId] = row;
      }
      metadataById.value = next;
    } catch (e) {
      metadataError.value = e instanceof Error ? e : new Error(String(e));
    } finally {
      metadataLoading.value = false;
      metadataInitialized.value = true;
      if (al.products.value.length > 0 || al.bundles.value.length > 0) {
        sdkCatalogHydrated.value = true;
      }
    }
  }

  const mergedProducts = computed((): MergedAudioloomProduct[] => {
    const map = metadataById.value;
    return al.products.value.map((p) =>
      mergeAudioloomProductWithMetadata(p, map[p.id]),
    );
  });

  const mergedBundles = computed((): MergedAudioloomBundle[] => {
    const map = metadataById.value;
    return al.bundles.value.map((b) =>
      mergeAudioloomBundleWithMetadata(b, map[b.id]),
    );
  });

  const visibleMergedProducts = computed((): MergedAudioloomProduct[] => {
    const list = mergedProducts.value.filter((p) => p.site.visible);
    return sortMergedStorefrontBySite(list);
  });

  const visibleMergedBundles = computed((): MergedAudioloomBundle[] => {
    const list = mergedBundles.value.filter((b) => b.site.visible);
    return sortMergedStorefrontBySite(list);
  });

  /**
   * Safe to render storefront + DB–merged catalog: SDK ran `setup`, product/bundle lists were hydrated,
   * and metadata fetch finished (use defaults if the request failed — see `metadataError`).
   * Not the same as `setupComplete` on `useAudioloom` (that is only `Audioloom.setup()` done).
   */
  const catalogReady = computed(() => {
    if (import.meta.server) {
      return false;
    }
    if (!al.setupComplete.value) {
      return false;
    }
    if (!sdkCatalogHydrated.value) {
      return false;
    }
    if (!metadataInitialized.value) {
      return false;
    }
    if (metadataLoading.value) {
      return false;
    }
    return true;
  });

  /** Visible products and bundles in one list, sorted by `site.sortOrder` then name (products first when tied). */
  const visibleMergedOfferings = computed(() => {
    const products = visibleMergedProducts.value.map((item) => ({
      kind: "product" as const,
      item,
    }));
    const bundles = visibleMergedBundles.value.map((item) => ({
      kind: "bundle" as const,
      item,
    }));
    return sortMergedOfferings([...products, ...bundles]);
  });

  async function refreshCatalog(): Promise<void> {
    if (import.meta.server) {
      return;
    }
    al.refreshProducts();
    al.refreshBundles();
    sdkCatalogHydrated.value = true;
    await loadMetadata();
  }

  /**
   * Waits for SDK products and bundles, then loads metadata for those ids (one round-trip).
   */
  async function syncCatalog(options?: {
    waitForProducts?: { timeoutMs?: number; pollMs?: number };
    waitForBundles?: { timeoutMs?: number; pollMs?: number };
  }): Promise<void> {
    if (import.meta.server) {
      return;
    }
    await Promise.all([
      al.waitForProducts(options?.waitForProducts),
      al.waitForBundles(options?.waitForBundles),
    ]);
    sdkCatalogHydrated.value = true;
    await loadMetadata();
  }

  /**
   * Partially updates `audioloom_product_metadata` via `PATCH /api/admin/audioloom-product-metadata`.
   * Merges returned rows into `metadataById`. Requires a logged-in session (admin).
   */
  async function updateAudioloomMetadata(
    payload: AudioloomMetadataPatchPayload,
  ): Promise<AudioloomMetadataPatchResult> {
    if (import.meta.server) {
      throw new Error("updateAudioloomMetadata is client-only");
    }

    const res = await $fetch<AudioloomMetadataPatchResult>(
      "/api/admin/audioloom-product-metadata",
      { method: "PATCH", body: payload },
    );

    if (res.rows.length > 0) {
      const next = { ...metadataById.value };
      for (const row of res.rows) {
        next[row.audioloomProductId] = row;
      }
      metadataById.value = next;
    }

    return res;
  }

  /**
   * Creates or replaces `audioloom_product_metadata` via `POST /api/admin/audioloom-product-metadata`.
   * Use when no row exists yet (PATCH would 404) or to set several fields at once.
   */
  async function upsertAudioloomMetadata(
    body: AudioloomMetadataUpsertPayload,
  ): Promise<AudioloomMetadataUpsertResult> {
    if (import.meta.server) {
      throw new Error("upsertAudioloomMetadata is client-only");
    }

    const res = await $fetch<AudioloomMetadataUpsertResult>(
      "/api/admin/audioloom-product-metadata",
      { method: "POST", body },
    );

    if (res.rows.length > 0) {
      const next = { ...metadataById.value };
      for (const row of res.rows) {
        next[row.audioloomProductId] = row;
      }
      metadataById.value = next;
    }

    return res;
  }

  function getProductBySlug(slug: string): MergedAudioloomProduct | undefined {
    return mergedProducts.value.find((p) => p.slug === slug);
  }

  return {
    ...al,
    catalogReady,
    metadataById,
    metadataLoading,
    metadataError,
    mergedProducts,
    mergedBundles,
    visibleMergedProducts,
    visibleMergedBundles,
    visibleMergedOfferings,
    loadMetadata,
    refreshCatalog,
    syncCatalog,
    updateAudioloomMetadata,
    upsertAudioloomMetadata,
    getProductBySlug,
  };
}
