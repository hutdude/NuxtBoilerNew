<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['unauthenticated']
})

const { mergedProducts, mergedBundles, catalogReady } = useAudioloomCatalog()

const catalogPending = computed(() => !catalogReady.value)

const SKELETON_PLACEHOLDERS = 8

const CURRENCIES = ['USD', 'EUR'] as const
type Currency = (typeof CURRENCIES)[number]

const cookieCurrency = useCookie<string>('audioloom-admin-currency', {
  default: () => 'USD',
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
  path: '/'
})

function normalizeCurrency(v: unknown): Currency {
  return v === 'EUR' || v === 'USD' ? v : 'USD'
}

/** Persists last choice (cookie); survives refresh and full navigation. */
const currencyChoice = computed(() => normalizeCurrency(cookieCurrency.value))

function setCurrency(c: Currency) {
  cookieCurrency.value = c
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Audioloom">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="inline-flex rounded-lg border border-default p-0.5 gap-0.5">
            <UButton
              v-for="c in CURRENCIES"
              :key="c"
              size="xs"
              :variant="currencyChoice === c ? 'solid' : 'ghost'"
              :label="c"
              @click="setCurrency(c)"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-10 p-4 sm:p-6">
        <section class="space-y-4">
          <h2 class="text-lg font-semibold text-highlighted">
            Products
          </h2>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <template v-if="catalogPending">
              <AdminAudioloomCard
                v-for="n in SKELETON_PLACEHOLDERS"
                :key="`skeleton-p-${n}`"
                loading
              />
            </template>
            <template v-else>
              <AdminAudioloomCard
                v-for="p in mergedProducts"
                :key="`product-${p.id}`"
                :item="p"
                :currency="currencyChoice"
              />
              <p
                v-if="mergedProducts.length === 0"
                class="col-span-full text-muted text-sm"
              >
                No products returned from AudioLoom.
              </p>
            </template>
          </div>
        </section>

        <section class="space-y-4">
          <h2 class="text-lg font-semibold text-highlighted">
            Bundles
          </h2>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <template v-if="catalogPending">
              <AdminAudioloomCard
                v-for="n in SKELETON_PLACEHOLDERS"
                :key="`skeleton-b-${n}`"
                loading
              />
            </template>
            <template v-else>
              <AdminAudioloomCard
                v-for="b in mergedBundles"
                :key="`bundle-${b.id}`"
                :item="b"
                :currency="currencyChoice"
              />
              <p
                v-if="mergedBundles.length === 0"
                class="col-span-full text-muted text-sm"
              >
                No bundles returned from AudioLoom.
              </p>
            </template>
          </div>
        </section>
      </div>
    </template>
  </UDashboardPanel>
</template>
