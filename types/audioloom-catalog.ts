import type { AudioloomBundle } from './audioloom-bundle'
import type { AudioloomProduct } from './audioloom-product'
import type {
  AudioloomProductCategory,
  AudioloomStorefrontKind
} from './audioloom-product-metadata'

export type AudioloomSiteMetadata = {
  /** false until a row exists in `audioloom_product_metadata` */
  hasMetadataRow: boolean
  visible: boolean
  sortOrder: number | null
  /** Set from DB when `hasMetadataRow`; otherwise inferred from SDK type. */
  kind?: AudioloomStorefrontKind
  /** DB: products only (`null` for bundles). Omitted or `null` when no row yet. */
  productCategory?: AudioloomProductCategory | null
  /** DB row timestamps — only when `hasMetadataRow` */
  createdAt?: string
  updatedAt?: string
}

export type MergedAudioloomProduct = AudioloomProduct & {
  site: AudioloomSiteMetadata
}

export type MergedAudioloomBundle = AudioloomBundle & {
  site: AudioloomSiteMetadata
}

export type { AudioloomProductCategory, AudioloomStorefrontKind }

export type MergedStorefrontOffering
  = | { kind: 'product', item: MergedAudioloomProduct }
    | { kind: 'bundle', item: MergedAudioloomBundle }
