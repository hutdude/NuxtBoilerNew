<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["unauthenticated"],
});

const { products, waitForProducts } = useAudioloom();

/** True until we’ve waited for the SDK catalog (or timed out). */
const catalogPending = ref(true);

const SKELETON_PLACEHOLDERS = 8;

onMounted(async () => {
  await waitForProducts();
  catalogPending.value = false;
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Audioloom">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-6 p-4 sm:p-6">
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <template v-if="catalogPending">
            <AdminAudioloomCard
              v-for="n in SKELETON_PLACEHOLDERS"
              :key="`skeleton-${n}`"
              loading
            />
          </template>
          <template v-else>
            <AdminAudioloomCard
              v-for="product in products"
              :key="product.id ?? product.name ?? String(product)"
              :product="product"
            />
            <p
              v-if="products.length === 0"
              class="col-span-full text-muted text-sm"
            >
              No products returned from AudioLoom.
            </p>
          </template>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
