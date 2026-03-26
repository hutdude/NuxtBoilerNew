import type { AudioloomBundle } from '../../types/audioloom-bundle'
import type { AudioloomProduct } from '../../types/audioloom-product'
import type { AudioloomProductMetadataRow } from '../../types/audioloom-product-metadata'
import type {
  AudioloomSiteMetadata,
  MergedAudioloomBundle,
  MergedAudioloomProduct,
  MergedStorefrontOffering
} from '../../types/audioloom-catalog'

function siteFromRow(row: AudioloomProductMetadataRow): AudioloomSiteMetadata {
  return {
    hasMetadataRow: true,
    visible: row.visible,
    sortOrder: row.sortOrder,
    kind: row.kind,
    productCategory: row.productCategory,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export function mergeAudioloomProductWithMetadata(
  product: AudioloomProduct,
  row: AudioloomProductMetadataRow | undefined
): MergedAudioloomProduct {
  return {
    ...product,
    site: row
      ? siteFromRow(row)
      : {
          hasMetadataRow: false,
          visible: false,
          sortOrder: null,
          kind: 'product',
          productCategory: null
        }
  }
}

export function mergeAudioloomBundleWithMetadata(
  bundle: AudioloomBundle,
  row: AudioloomProductMetadataRow | undefined
): MergedAudioloomBundle {
  return {
    ...bundle,
    site: row
      ? siteFromRow(row)
      : {
          hasMetadataRow: false,
          visible: false,
          sortOrder: null,
          kind: 'bundle',
          productCategory: null
        }
  }
}

/** Sort by `site.sortOrder` (nulls last), then `name`. */
export function sortMergedStorefrontBySite<
  T extends { site: AudioloomSiteMetadata, name: string }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = a.site.sortOrder
    const bo = b.site.sortOrder
    if (ao !== null && bo !== null && ao !== bo) {
      return ao - bo
    }
    if (ao !== null && bo === null) {
      return -1
    }
    if (ao === null && bo !== null) {
      return 1
    }
    return a.name.localeCompare(b.name)
  })
}

export function sortMergedOfferings(
  items: MergedStorefrontOffering[]
): MergedStorefrontOffering[] {
  return [...items].sort((a, b) => {
    const ao = a.item.site.sortOrder
    const bo = b.item.site.sortOrder
    if (ao !== null && bo !== null && ao !== bo) {
      return ao - bo
    }
    if (ao !== null && bo === null) {
      return -1
    }
    if (ao === null && bo !== null) {
      return 1
    }
    const nameCmp = a.item.name.localeCompare(b.item.name)
    if (nameCmp !== 0) {
      return nameCmp
    }
    if (a.kind === b.kind) {
      return 0
    }
    return a.kind === 'product' ? -1 : 1
  })
}
