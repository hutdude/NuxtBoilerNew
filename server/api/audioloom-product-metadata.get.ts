import {
  ensureAudioloomProductMetadataRows,
  listAudioloomProductMetadata,
  listAudioloomProductMetadataByIds
} from '../db/queries/audioloom-product-metadata'

function parseCsv(value: unknown): string[] {
  if (typeof value !== 'string' || value.length === 0) {
    return []
  }
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const productIds = parseCsv(query.productIds)
  const bundleIds = parseCsv(query.bundleIds)
  const explicitProductBundleKeys
    = query.productIds !== undefined || query.bundleIds !== undefined

  if (explicitProductBundleKeys) {
    if (productIds.length === 0 && bundleIds.length === 0) {
      return { rows: [] }
    }
    await ensureAudioloomProductMetadataRows({ productIds, bundleIds })
    const allIds = [...new Set([...productIds, ...bundleIds])]
    const rows = await listAudioloomProductMetadataByIds(allIds)
    return { rows }
  }

  const idsRaw = query.ids
  if (typeof idsRaw === 'string' && idsRaw.length > 0) {
    const ids = parseCsv(idsRaw)
    await ensureAudioloomProductMetadataRows({ productIds: ids, bundleIds: [] })
    const rows = await listAudioloomProductMetadataByIds(ids)
    return { rows }
  }

  const rows = await listAudioloomProductMetadata()
  return { rows }
})
