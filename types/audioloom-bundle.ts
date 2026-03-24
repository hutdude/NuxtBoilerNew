import type {
  AudioloomPricingConfiguration,
  AudioloomProduct
} from './audioloom-product'

/** Product entry inside `getBundles()`’s `products` array (same shape as catalog products + `included`). */
export type AudioloomBundleLineProduct = AudioloomProduct & {
  included?: boolean
}

export type AudioloomBundle = {
  id: string
  name: string
  tagline: string
  description: string
  iconUrl: string
  partial: boolean
  products: AudioloomBundleLineProduct[]
  pricingConfiguration: AudioloomPricingConfiguration
  type: 'bundle'
}
