/** Present when `hasDiscount` is true on bundles/products from the SDK. */
export type AudioloomPricingDiscount = {
  type: string
  name?: string
  description?: string
  percentage?: number
  total?: { EUR: number, USD: number }
  isExclusive?: boolean
}

export type AudioloomPricingConfiguration = {
  id: string
  name: string
  originalPrice: { EUR: number, USD: number }
  price: { EUR: number, USD: number }
  hasDiscount: boolean
  discount?: AudioloomPricingDiscount
}

export type AudioloomProduct = {
  id: string
  name: string
  tagline: string
  description: string
  iconUrl: string
  pricingConfiguration: AudioloomPricingConfiguration
  type: 'product'
}
