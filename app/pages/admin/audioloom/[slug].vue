<script setup lang="ts">
const { slug } = useRoute().params;
const { getProduct, waitForProducts, products } = useAudioloom();


const product = computed(() => products.value.find((p) => p.id === slug));
const editMode = ref(false);

function handleEdit() {
  editMode.value = !editMode.value;
  if (editMode.value) {
    // Open the edit modal
    //editModal.value = true;
  }
  else {
    // Close the edit modal
    // editModal.value = false;

    // Save the changes
  }
}

onMounted(async () => {
  await waitForProducts();
});

definePageMeta({
  layout: "admin",
  middleware: ["unauthenticated"],
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="`${product?.name}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
            <UButton :icon="editMode ? 'i-lucide-save' : 'i-lucide-edit'" :variant="editMode ? 'solid' : 'soft'" @click="handleEdit">
                {{ editMode ? "Save" : "Edit" }}
            </UButton>
            <UButton icon="i-lucide-arrow-left" color="neutral" variant="soft" @click="navigateTo('/admin/audioloom')">
                Back
            </UButton>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
        <UPage>
            <UPageHeader title="Website Controls"/>
            <UPageBody>
                <div class="space-y-6 ">
                   <USwitch v-model="value" label="Display on Site"/>
                </div>
            </UPageBody>
            <UPageHeader title="Audioloom Controlled Data"/>
            <UPageBody>
                <div class="space-y-6 ">
                    <h3 class="al-data-title">Name</h3>
                   <p>{{ product?.name }}</p>
                   <h3 class="al-data-title">Description</h3>
                   <p>{{ product?.description }}</p>
                   <h3 class="al-data-title">Original Price</h3>
                   <p>USD: ${{ product?.pricingConfiguration.originalPrice.USD }}</p>
                   <p>EUR: €{{ product?.pricingConfiguration.originalPrice.EUR }}</p>
                   <h3 class="al-data-title">Sale Price</h3>
                   <p>USD: ${{ product?.pricingConfiguration.price.USD }}</p>
                   <p>EUR: €{{ product?.pricingConfiguration.price.EUR }}</p>
                   <h3 class="al-data-title">Image</h3>
                   <img :src="product?.iconUrl" alt="Product Image" class="w-1/2 h-auto rounded-md"/>
                </div>
            </UPageBody>
                </UPage>
            </template>
    </UDashboardPanel>
</template>

<style scoped>
@reference "../../../assets/css/main.css";

.al-data-title {
  @apply text-lg font-bold mb-0;
}
</style>