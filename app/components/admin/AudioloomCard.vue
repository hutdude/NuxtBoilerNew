<script setup lang="ts">
import type { AudioloomBundle } from '../../../types/audioloom-bundle'
import type { AudioloomProduct } from '../../../types/audioloom-product'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    /** Product or bundle from the AudioLoom SDK (same card layout). */
    item?: AudioloomProduct | AudioloomBundle
    currency?: string
  }>(),
  { loading: false, currency: 'USD' }
)

const showSkeleton = computed(() => props.loading)

const isBundle = computed(
  () => props.item?.type === 'bundle'
)

const currencySymbol = computed(() => {
  return props.currency === 'USD' ? '$' : '€'
})

const price = computed(() => {
  return props.item?.pricingConfiguration?.price?.[props.currency]
})

const originalPrice = computed(() => {
  return props.item?.pricingConfiguration?.originalPrice?.[props.currency]
})
</script>

<template>
  <UCard
    :class="showSkeleton ? 'pointer-events-none cursor-default' : 'cursor-pointer'"
    @click="showSkeleton || !item?.id ? undefined : navigateTo(`/admin/audioloom/${item.id}`)"
  >
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <USkeleton
          v-if="showSkeleton"
          class="h-6 w-3/4 max-w-xs"
        />
        <template v-else>
          <h2 class="text-lg font-medium">
            {{ item?.name }}
          </h2>
          <UBadge
            :label="isBundle ? 'Bundle' : 'Product'"
            color="neutral"
            variant="subtle"
            size="sm"
          />
        </template>
      </div>
    </template>

    <div
      v-if="showSkeleton"
      class="flex flex-col gap-3"
    >
      <USkeleton class="aspect-[4/3] w-full max-w-xs rounded-lg" />
      <USkeleton class="h-3 w-full" />
      <USkeleton class="h-3 w-5/6" />
      <USkeleton class="h-3 w-4/6" />
      <USkeleton class="h-3 w-full" />
    </div>

    <div
      v-else
      class="flex flex-col gap-2"
    >
      <img
        :src="item?.iconUrl"
        alt=""
        class="max-w-xs w-full h-auto rounded-md"
      >
      <p class="text-sm text-muted line-clamp-3">
        {{ item?.description }}
      </p>
    </div>

    <template #footer>
      <USkeleton
        v-if="showSkeleton"
        class="h-5 w-24"
      />
      <p
        v-else
        class="font-medium"
      >
        {{ currencySymbol }}{{ price }} <span v-if="originalPrice && originalPrice > price" class="text-muted text-sm line-through">{{ currencySymbol }}{{ originalPrice }}</span>
      </p>
    </template>
  </UCard>
</template>
