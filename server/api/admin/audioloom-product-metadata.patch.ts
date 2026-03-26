import { z } from 'zod'
import { patchAudioloomProductMetadataMany } from '../../db/queries/audioloom-product-metadata'

const patchItemSchema = z
  .object({
    audioloomProductId: z.string().min(1),
    kind: z.enum(['product', 'bundle']).optional(),
    productCategory: z.enum(['sample-pack', 'plugin']).optional(),
    visible: z.boolean().optional(),
    sortOrder: z.union([z.number().int(), z.null()]).optional()
  })
  .refine(
    data =>
      data.kind !== undefined
      || data.productCategory !== undefined
      || data.visible !== undefined
      || data.sortOrder !== undefined,
    { message: 'Provide at least one of kind, productCategory, visible, sortOrder' }
  )
  .refine(
    data =>
      data.productCategory === undefined || data.kind === 'product',
    { message: 'productCategory is only valid with kind "product"' }
  )

const bodySchema = z.union([
  patchItemSchema,
  z.object({
    items: z.array(patchItemSchema).min(1)
  })
])

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const parsed = await readValidatedBody(event, bodySchema.parse)
  const items = 'items' in parsed ? parsed.items : [parsed]

  const { rows, notFoundIds } = await patchAudioloomProductMetadataMany(
    items.map(item => ({
      audioloomProductId: item.audioloomProductId,
      kind: item.kind,
      productCategory: item.productCategory,
      visible: item.visible,
      sortOrder: item.sortOrder
    }))
  )

  if (items.length === 1 && notFoundIds.length === 1) {
    throw createError({
      statusCode: 404,
      statusMessage: 'audioloom_product_metadata row not found for audioloomProductId'
    })
  }

  return {
    ok: true,
    count: rows.length,
    rows,
    notFoundIds
  }
})
