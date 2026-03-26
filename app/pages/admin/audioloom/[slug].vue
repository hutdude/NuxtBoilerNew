<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { queryContentFirstByStem } from '~/composables/useContentFirst'
import { queryProductPdpDoc } from '~/utils/audioloom-product-content'

definePageMeta({
  layout: 'admin',
  middleware: ['unauthenticated']
})

const pdpExists = ref(false)

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const {
  mergedProducts,
  mergedBundles,
  catalogReady,
  updateAudioloomMetadata,
  upsertAudioloomMetadata
} = useAudioloomCatalog()

const selection = computed(() => {
  const id = slug.value
  const product = mergedProducts.value.find(p => p.id === id)
  if (product) {
    return { kind: 'product' as const, data: product }
  }
  const bundle = mergedBundles.value.find(b => b.id === id)
  if (bundle) {
    return { kind: 'bundle' as const, data: bundle }
  }
  return null
})

watch(
  () => [
    catalogReady.value,
    selection.value?.kind,
    selection.value?.data.id,
    selection.value?.kind === 'product'
      ? selection.value.data.site.productCategory
      : null
  ] as const,
  async () => {
    if (!catalogReady.value || !selection.value) {
      pdpExists.value = false
      return
    }
    try {
      if (selection.value.kind === 'bundle') {
        const doc = await queryContentFirstByStem(
          `bundle/${selection.value.data.id}`
        )
        pdpExists.value = !!doc
      } else {
        const doc = await queryProductPdpDoc(selection.value.data.id)
        pdpExists.value = !!doc
      }
    }
    catch {
      pdpExists.value = false
    }
  },
  { immediate: true }
)

const visibility = reactive({ saving: false, error: null as string | null })
const sortDraft = ref('')
const sortState = reactive({ saving: false, error: null as string | null })
const categoryState = reactive({ saving: false, error: null as string | null })

function errMsg(e: unknown): string {
  if (
    e && typeof e === 'object' && 'data' in e
    && e.data && typeof e.data === 'object' && 'message' in e.data
  ) {
    return String((e as { data: { message?: unknown } }).data.message)
  }
  if (e instanceof Error) {
    return e.message
  }
  return String(e)
}

watch(
  () => [
    selection.value?.data.id,
    selection.value?.data.site.sortOrder,
    selection.value?.data.site.hasMetadataRow
  ] as const,
  () => {
    const sel = selection.value
    if (!sel) {
      sortDraft.value = ''
      return
    }
    const o = sel.data.site.sortOrder
    sortDraft.value = o === null || o === undefined ? '' : String(o)
  },
  { immediate: true }
)

function parseSortDraft():
  | { ok: true, value: number | null }
  | { ok: false, message: string } {
  const raw = String(sortDraft.value).trim()
  if (raw === '') {
    return { ok: true, value: null }
  }
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) {
    return { ok: false, message: 'Sort order must be an integer' }
  }
  return { ok: true, value: n }
}

/** Short DB status (no timestamps — sort is edited below). */
const dbMetaLine = computed(() => {
  const s = selection.value?.data.site
  if (!s) {
    return null
  }
  if (!s.hasMetadataRow) {
    return 'No DB row'
  }
  const parts: string[] = [s.kind ?? '—']
  if (selection.value?.kind === 'product' && s.productCategory) {
    parts.push(s.productCategory)
  }
  parts.push(s.visible ? 'on' : 'off')
  return parts.join(' · ')
})

const storefrontTypeLabel = computed(() => {
  const sel = selection.value
  if (!sel || sel.kind !== 'product') {
    return '—'
  }
  return (sel.data.site.productCategory ?? 'plugin') === 'sample-pack'
    ? 'Sample pack'
    : 'Plugin'
})

const storefrontCategoryItems = computed<DropdownMenuItem[][]>(() => {
  const sel = selection.value
  if (!sel || sel.kind !== 'product') {
    return [[]]
  }
  return [
    [
      {
        label: 'Plugin',
        icon: 'i-lucide-puzzle',
        onSelect: (e: Event) => {
          e.preventDefault()
          void setProductCategory('plugin')
        }
      },
      {
        label: 'Sample pack',
        icon: 'i-lucide-layers',
        onSelect: (e: Event) => {
          e.preventDefault()
          void setProductCategory('sample-pack')
        }
      }
    ]
  ]
})

async function setProductCategory(next: 'sample-pack' | 'plugin') {
  const sel = selection.value
  if (!sel || sel.kind !== 'product') {
    return
  }
  const current = sel.data.site.productCategory ?? 'plugin'
  if (next === current && sel.data.site.hasMetadataRow) {
    categoryState.error = null
    return
  }
  categoryState.saving = true
  categoryState.error = null
  try {
    if (next !== current) {
      await $fetch('/api/admin/content-pdp-move', {
        method: 'POST',
        body: {
          id: sel.data.id,
          productCategory: next
        }
      })
    }
    if (sel.data.site.hasMetadataRow) {
      await updateAudioloomMetadata({
        audioloomProductId: sel.data.id,
        kind: 'product',
        productCategory: next
      })
    } else {
      await upsertAudioloomMetadata({
        audioloomProductId: sel.data.id,
        kind: 'product',
        visible: sel.data.site.visible,
        sortOrder: sel.data.site.sortOrder,
        productCategory: next
      })
    }
  } catch (e: unknown) {
    categoryState.error = errMsg(e) || 'Could not update product type'
  } finally {
    categoryState.saving = false
  }
}

async function commitSortOrder() {
  const sel = selection.value
  if (!sel) {
    return
  }

  // validate entry is a number
  const parsed = parseSortDraft()
  if (!parsed.ok) {
    sortState.error = parsed.message
    return
  }
  const next = parsed.value
  const current = sel.data.site.sortOrder

  // if same value, do nothing
  if (next === current) {
    sortState.error = null
    return
  }

  
  sortState.saving = true
  sortState.error = null
  const kind = sel.kind === 'bundle' ? 'bundle' : 'product'
  try {
    if (sel.data.site.hasMetadataRow) {
      await updateAudioloomMetadata({
        audioloomProductId: sel.data.id,
        kind,
        sortOrder: next
      })
    } else {
      await upsertAudioloomMetadata({
        audioloomProductId: sel.data.id,
        kind,
        visible: sel.data.site.visible,
        sortOrder: next,
        productCategory: sel.kind === 'product'
          ? (sel.data.site.productCategory ?? 'plugin')
          : undefined
      })
    }
  } catch (e: unknown) {
    sortState.error = errMsg(e) || 'Could not save sort order'
  } finally {
    sortState.saving = false
  }
}

async function setSiteVisible(next: boolean) {
  const sel = selection.value
  if (!sel) {
    return
  }
  if (!pdpExists.value) {
    toast.add({
      title: 'PDP does not exist',
      description: 'Create a PDP before setting visibility',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  visibility.saving = true
  visibility.error = null
  try {
    await updateAudioloomMetadata({
      audioloomProductId: sel.data.id,
      kind: sel.kind === 'bundle' ? 'bundle' : 'product',
      visible: next
    })
  } catch (e: unknown) {
    visibility.error = errMsg(e) || 'Could not update visibility'
  } finally {
    visibility.saving = false
  }
}

const publicPageHref = computed(() => {
  if (!selection.value) {
    return undefined
  }
  if (selection.value.kind === 'bundle') {
    return `/bundles/${selection.value.data.id}`
  }
  const cat = selection.value.data.site.productCategory ?? 'plugin'
  return cat === 'sample-pack'
    ? `/samples/${selection.value.data.id}`
    : `/plugins/${selection.value.data.id}`
})

const title = computed(() => selection.value?.data.name ?? 'AudioLoom')

const toast = useToast()
const createPdpSaving = ref(false)

async function createPdp() {
  const sel = selection.value
  if (!sel || createPdpSaving.value) {
    return
  }
  createPdpSaving.value = true
  try {
    await $fetch('/api/admin/content-pdp', {
      method: 'POST',
      body: {
        kind: sel.kind === 'bundle' ? 'bundle' : 'product',
        id: sel.data.id,
        title: sel.data.name,
        description: sel.data.description,
        productCategory:
          sel.kind === 'product'
            ? (sel.data.site.productCategory ?? 'plugin')
            : undefined
      }
    })
    pdpExists.value = true
    toast.add({
      title: 'PDP markdown created',
      description:
        sel.kind === 'bundle'
          ? 'File added under content/bundle.'
          : 'File added under content/products/plugins or content/products/sample-packs.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  }
  catch (e: unknown) {
    const status = e && typeof e === 'object' && 'statusCode' in e
      ? (e as { statusCode?: number }).statusCode
      : undefined
    const msg = errMsg(e)
    toast.add({
      title: status === 409 ? 'PDP already exists' : 'Could not create PDP',
      description: msg || undefined,
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
  finally {
    createPdpSaving.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="catalogReady && selection && pdpExists"
            icon="i-lucide-external-link"
            variant="solid"
            :to="publicPageHref"
            target="_blank"
          >
            View product page
          </UButton>
          <UButton
            v-if="catalogReady && selection && !pdpExists"
            icon="i-lucide-plus"
            variant="solid"
            :loading="createPdpSaving"
            :disabled="createPdpSaving"
            @click="createPdp"
          >
            Create PDP
          </UButton>
          <UButton
            class="cursor-pointer"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="soft"
            @click="navigateTo('/admin/audioloom')"
          >
            Back
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div
        v-if="!catalogReady"
        class="p-6"
      >
        <USkeleton class="h-8 w-48 mb-4" />
        <USkeleton class="h-32 w-full max-w-lg" />
      </div>
      <UPage v-else-if="selection">
        <UPageHeader title="Website controls" />
        <UPageBody>
          <div class="space-y-4">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <UBadge
                :label="selection.kind === 'bundle' ? 'Bundle' : 'Product'"
                color="neutral"
                variant="subtle"
              />
              <span class="text-sm text-muted font-mono tabular-nums">
                {{ dbMetaLine }}
              </span>
            </div>
            <div
              v-if="selection.kind === 'product'"
              class="space-y-1 max-w-xs"
            >
              <label class="text-sm font-medium text-default">Storefront type</label>
              <UDropdownMenu
                :items="storefrontCategoryItems"
                :content="{ align: 'start', collisionPadding: 12 }"
                :ui="{ content: 'w-56' }"
              >
                <UButton
                  color="neutral"
                  variant="outline"
                  trailing-icon="i-lucide-chevrons-up-down"
                  class="w-full justify-between"
                  :loading="categoryState.saving"
                  :disabled="categoryState.saving"
                >
                  {{ storefrontTypeLabel }}
                </UButton>
              </UDropdownMenu>
              <p
                v-if="categoryState.error"
                class="text-sm text-error"
              >
                {{ categoryState.error }}
              </p>
              <p class="text-xs text-muted">
                PDP markdown lives under <code class="text-xs">content/products/plugins</code> or <code class="text-xs">content/products/sample-packs</code>. Changing type moves the file when it already exists.
              </p>
            </div>
            <div class="space-y-1">
              <USwitch
                :model-value="selection.data.site.visible"
                :loading="visibility.saving"
                :disabled="visibility.saving"
                label="Display on site"
                @update:model-value="setSiteVisible"
              />
              <p
                v-if="visibility.error"
                class="text-sm text-error"
              >
                {{ visibility.error }}
              </p>
            </div>
            <div class="space-y-1 max-w-xs">
              <label class="text-sm font-medium text-default">Sort order</label>
              <UInput
                v-model="sortDraft"
                type="number"
                placeholder="Empty = unset"
                :loading="sortState.saving"
                :disabled="sortState.saving"
                @blur="commitSortOrder"
                @keydown.enter.prevent="commitSortOrder"
              />
              <p
                v-if="sortState.error"
                class="text-sm text-error"
              >
                {{ sortState.error }}
              </p>
              <p class="text-xs text-muted">
                Lower numbers appear first; leave empty for default ordering.
              </p>
            </div>
          </div>
        </UPageBody>

        <UPageHeader title="AudioLoom data" />
        <UPageBody>
          <div class="space-y-6">
            <div>
              <h3 class="al-data-title">
                Name
              </h3>
              <p>{{ selection.data.name }}</p>
            </div>
            <div>
              <h3 class="al-data-title">
                Description
              </h3>
              <p>{{ selection.data.description }}</p>
            </div>
            <div>
              <h3 class="al-data-title">
                Original price
              </h3>
              <p>USD: ${{ selection.data.pricingConfiguration.originalPrice.USD }}</p>
              <p>EUR: €{{ selection.data.pricingConfiguration.originalPrice.EUR }}</p>
            </div>
            <div>
              <h3 class="al-data-title">
                Sale price
              </h3>
              <p>USD: ${{ selection.data.pricingConfiguration.price.USD }}</p>
              <p>EUR: €{{ selection.data.pricingConfiguration.price.EUR }}</p>
            </div>
            <div>
              <h3 class="al-data-title">
                Image
              </h3>
              <img
                :src="selection.data.iconUrl"
                alt=""
                class="w-1/2 h-auto rounded-md max-w-md"
              >
            </div>

            <template v-if="selection.kind === 'bundle'">
              <div>
                <h3 class="al-data-title">
                  Included products
                </h3>
                <ul class="list-disc pl-5 space-y-1 text-sm">
                  <li
                    v-for="line in selection.data.products"
                    :key="line.id"
                  >
                    {{ line.name }}
                    <span
                      v-if="line.included === false"
                      class="text-muted"
                    >(not included)</span>
                  </li>
                </ul>
              </div>
            </template>
          </div>
        </UPageBody>
      </UPage>
      <div
        v-else
        class="p-6 text-muted text-sm"
      >
        No product or bundle matches “{{ slug }}”.
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
@reference "../../../assets/css/main.css";

.al-data-title {
  @apply text-lg font-bold mb-0;
}
</style>
