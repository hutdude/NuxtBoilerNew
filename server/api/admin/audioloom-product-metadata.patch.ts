import { z } from 'zod'
import { patchAudioloomProductMetadataMany } from '../../db/queries/audioloom-product-metadata'

const patchItemSchema = z
  .object({
    audioloomProductId: z.string().min(1),
    kind: z.enum(['product', 'bundle']).optional(),
    visible: z.boolean().optional(),
    sortOrder: z.union([z.number().int(), z.null()]).optional()
  })
  .refine(
    data =>
      data.kind !== undefined
      || data.visible !== undefined
      || data.sortOrder !== undefined,
    { message: 'Provide at least one of kind, visible, sortOrder' }
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
