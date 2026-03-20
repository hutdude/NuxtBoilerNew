<script setup lang="ts">
const { setupComplete } = useAudioloom();

const props = withDefaults(
  defineProps<{
    
    loading?: boolean;
    product?: {
      id?: string;
      name?: string;
      description?: string;
      price?: unknown;
      iconUrl?: string;
      image?: string;
      url?: string;
    };
  }>(),
  { loading: false },
);

const showSkeleton = computed(
  () => props.loading || !setupComplete.value,
);
</script>

<template>
  <UCard
    :class="showSkeleton ? 'pointer-events-none cursor-default' : 'cursor-pointer'"
    @click="showSkeleton || !product?.id ? undefined : navigateTo(`/admin/audioloom/${product.id}`)"
  >
    <template #header>
      <USkeleton v-if="showSkeleton" class="h-6 w-3/4 max-w-xs" />
      <h2 v-else class="text-lg font-medium">
        {{ product?.name }}
      </h2>
    </template>

    <div v-if="showSkeleton" class="flex flex-col gap-3">
      <USkeleton class="aspect-[4/3] w-full max-w-xs rounded-lg" />
      <USkeleton class="h-3 w-full" />
      <USkeleton class="h-3 w-5/6" />
      <USkeleton class="h-3 w-4/6" />
      <USkeleton class="h-3 w-full" />
    </div>

    <div v-else class="flex flex-col gap-2">
      <img
        :src="product?.iconUrl"
        alt=""
        class="max-w-xs w-full h-auto rounded-md"
      />
      <p>{{ product?.description }}</p>
      <p>{{ product?.image }}</p>
      <p>{{ product?.url }}</p>
    </div>

    <template #footer>
      <USkeleton v-if="showSkeleton" class="h-5 w-24" />
      <p v-else>
        
        ${{ product?.pricingConfiguration.price.USD }}


      </p>
    </template>
  </UCard>
</template>
