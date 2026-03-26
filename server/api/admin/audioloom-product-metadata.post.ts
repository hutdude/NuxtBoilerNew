import { z } from 'zod'
import { upsertAudioloomProductMetadataMany } from '../../db/queries/audioloom-product-metadata'

const itemSchema = z
  .object({
    audioloomProductId: z.string().min(1),
    kind: z.enum(['product', 'bundle']).optional().default('product'),
    productCategory: z.enum(['sample-pack', 'plugin']).optional(),
    visible: z.boolean().optional().default(false),
    sortOrder: z.number().int().nullable().optional()
  })
  .refine(
    data => data.kind !== 'bundle' || data.productCategory === undefined,
    { message: 'productCategory must not be set for bundles' }
  )

const bodySchema = z.union([
  itemSchema,
  z.object({
    items: z.array(itemSchema).min(1)
  })
])

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const parsed = await readValidatedBody(event, bodySchema.parse)
  const items = 'items' in parsed ? parsed.items : [parsed]

  const rows = await upsertAudioloomProductMetadataMany(
    items.map(item => ({
      audioloomProductId: item.audioloomProductId,
      kind: item.kind,
      productCategory: item.productCategory,
      visible: item.visible,
      sortOrder: item.sortOrder
    }))
  )

  return {
    ok: true,
    count: rows.length,
    rows
  }
})
