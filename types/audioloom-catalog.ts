import type { AudioloomBundle } from './audioloom-bundle'
import type { AudioloomProduct } from './audioloom-product'
import type { AudioloomStorefrontKind } from './audioloom-product-metadata'

export type AudioloomSiteMetadata = {
  /** false until a row exists in `audioloom_product_metadata` */
  hasMetadataRow: boolean
  visible: boolean
  sortOrder: number | null
  /** Set from DB when `hasMetadataRow`; otherwise inferred from SDK type. */
  kind?: AudioloomStorefrontKind
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

export type { AudioloomStorefrontKind }

export type MergedStorefrontOffering
  = | { kind: 'product', item: MergedAudioloomProduct }
    | { kind: 'bundle', item: MergedAudioloomBundle }
