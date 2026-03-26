<script setup lang="ts">
import type { MergedProduct } from "~/composables/useAudioLoomIntegration";

interface NavProductItemProps {
  product?: MergedProduct;
  loading?: boolean;
}

const props = withDefaults(defineProps<NavProductItemProps>(), {
  loading: false,
});

const emit = defineEmits<{
  close: [];
}>();

// Use a more stable image loading approach
const imageLoading = ref(true);
const imageLoaded = ref(false);

// Create a unique key for each product to help with caching
const productKey = computed(() => {
  if (!props.product) return "loading";
  return `${props.product.type}-${props.product.slug}`;
});

// Reset image loading state when product changes
watch(
  () => props.product?.slug,
  (newSlug, oldSlug) => {
    if (newSlug !== oldSlug) {
      imageLoading.value = true;
      imageLoaded.value = false;
    }
  },
  { immediate: true },
);

const onImageLoad = () => {
  imageLoading.value = false;
  imageLoaded.value = true;
};

const onImageError = () => {
  imageLoading.value = false;
  imageLoaded.value = false;
};

// Function to get the correct href for bundles
const getProductHref = (product: MergedProduct | null | undefined) => {
  if (!product) return '#';
  
  // If product has a custom href, use it
  if (product.href && product.href !== '#') {
    return product.href;
  }
  
  // Handle bundle hrefs
  if (product.tags?.includes('bundle')) {
    switch (product.slug) {
      case "launch-bundle":
        return "/bundles/launch-bundle";
      case "dynamic-duo":
        return "/bundles/dynamic-duo";
      case "cactus-clipper-bundle":
        return "/plugins/cactus-clipper";
      default:
        return `/bundles/${product.slug}`;
    }
  }
  
  // Default to plugin or sample pages
  if (product.type === 'plugin') {
    return `/plugins/${product.slug}`;
  } else if (product.type === 'sample') {
    return `/samples/${product.slug}`;
  }
  
  return '#';
};

const handleClick = () => {
  emit("close");
};

// Memoize the image URL to prevent unnecessary re-renders
const imageUrl = computed(() => {
  if (!props.product?.image || props.product.image === "Product Image") {
    return null;
  }
  return props.product.image;
});
</script>

<template>
  <NuxtLink
    :to="getProductHref(props.product)"
    class="group flex flex-col w-full max-w-[200px] transition-all duration-200 hover:scale-105"
    :class="{ 'pointer-events-none cursor-default opacity-75': props.loading }"
    @click="handleClick"
  >
    <div
      class="relative w-full aspect-square rounded-xl mb-2 overflow-hidden"
      :class="{ 'bg-gray-100': !props.product?.hasBackground }"
    >
      <!-- Loading Skeleton -->
      <div
        v-if="props.loading || (imageLoading && !imageLoaded)"
        class="absolute inset-0 bg-gray-200 animate-pulse"
      ></div>

      <!-- Plugin Display: Blurred background + centered image OR full cover image -->
      <template v-if="props.product?.type === 'plugin' && imageUrl">
        <!-- For plugins with backgrounds: use object-cover, no blur -->
        <template v-if="props.product?.hasBackground">
          <NuxtImg
            :key="`main-${productKey}`"
            :src="imageUrl"
            :alt="props.product?.name"
            placeholder="data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
            loading="lazy"
            format="webp"
            quality="80"
            sizes="300px"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            :class="{ 'opacity-0': imageLoading && !imageLoaded }"
            @load="onImageLoad"
            @error="onImageError"
          />
        </template>
        <!-- For plugins without backgrounds: blurred background + centered image -->
        <template v-else>
          <!-- Blurred Background -->
          <NuxtImg
            :key="`bg-${productKey}`"
            :src="imageUrl"
            :alt="props.product?.name + ' background'"
            placeholder="data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
            loading="lazy"
            format="webp"
            quality="40"
            sizes="300px"
            class="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
            :class="{ 'opacity-0': imageLoading && !imageLoaded }"
          />
          <!-- Centered Plugin Image -->
          <div class="absolute inset-0 flex items-center justify-center p-4">
            <NuxtImg
              :key="`main-${productKey}`"
              :src="imageUrl"
              :alt="props.product?.name"
              placeholder="data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
              loading="lazy"
              format="webp"
              quality="80"
              class="w-full h-auto max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
              :class="{ 'opacity-0': imageLoading && !imageLoaded }"
              @load="onImageLoad"
              @error="onImageError"
            />
          </div>
        </template>
      </template>

      <!-- Bundle Display: Blurred background + centered image OR full cover image -->
      <template v-else-if="props.product?.type === 'bundle' && imageUrl">
        <!-- For bundles with backgrounds: use object-cover, no blur -->
        <template v-if="props.product?.hasBackground">
          <NuxtImg
            :key="`main-${productKey}`"
            :src="imageUrl"
            :alt="props.product?.name"
            placeholder="data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
            loading="lazy"
            format="webp"
            quality="80"
            sizes="300px"
            class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            :class="{ 'opacity-0': imageLoading && !imageLoaded }"
            @load="onImageLoad"
            @error="onImageError"
          />
        </template>
        <!-- For bundles without backgrounds: blurred background + centered image -->
        <template v-else>
          <!-- Blurred Background -->
          <NuxtImg
            :key="`bg-${productKey}`"
            :src="imageUrl"
            :alt="props.product?.name + ' background'"
            placeholder="data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
            loading="lazy"
            format="webp"
            quality="40"
            sizes="300px"
            class="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
            :class="{ 'opacity-0': imageLoading && !imageLoaded }"
          />
          <!-- Centered Bundle Image -->
          <div class="absolute inset-0 flex items-center justify-center p-4">
            <NuxtImg
              :key="`main-${productKey}`"
              :src="imageUrl"
              :alt="props.product?.name"
              placeholder="data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
              loading="lazy"
              format="webp"
              quality="80"
              class="w-full h-auto max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
              :class="{ 'opacity-0': imageLoading && !imageLoaded }"
              @load="onImageLoad"
              @error="onImageError"
            />
          </div>
        </template>
      </template>

      <!-- Sample Display: Standard cover image -->
      <NuxtImg
        v-else-if="imageUrl"
        :key="`sample-${productKey}`"
        :src="imageUrl"
        :alt="props.product?.name"
        placeholder="data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
        loading="lazy"
        format="webp"
        quality="80"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        :class="{ 'opacity-0': imageLoading && !imageLoaded }"
        @load="onImageLoad"
        @error="onImageError"
      />

      <!-- Fallback when no image -->
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
      >
        <UIcon name="i-lucide-image" class="w-8 h-8 text-gray-400" />
      </div>
    </div>

    <!-- Product Name -->
    <div class="flex flex-col gap-1">
      <!-- Loading Skeleton -->
      <template v-if="props.loading">
        <div class="h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
      </template>

      <!-- Actual Content -->
      <template v-else>
        <h3
          class="font-semibold text-sm leading-tight text-gray-900 group-hover:text-primary transition-colors"
        >
          {{ props.product?.name }}
        </h3>
      </template>
    </div>
  </NuxtLink>
</template>
