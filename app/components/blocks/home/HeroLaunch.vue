<script setup lang="ts">
import BackgroundImage from "~/components/ui/BackgroundImage.vue";
import EverythingBundle from "~/pages/bundles/everything-bundle.vue";

// Use AudioLoom integration for dynamic pricing and bundle data
const { getMergedProduct, hasProductData, getBundlePricing } = useAudioLoomIntegration();

// Get bundle pricing for launch bundle (reactive)
const launchBundlePricing = computed(() => getBundlePricing("launch-bundle"));

// Get bundle pricing for cactus clipper bundle (reactive)
const cactusBundlePricing = computed(() => getBundlePricing("cactus-clipper-bundle"));

// Get bundle pricing for everything friday bundle (reactive)
const everythingBundlePricing = computed(() => getBundlePricing("everything-bundle"));

// Featured products data (reactive)
const featuredProducts = computed(() => [
  
/*{
    name: "Launch Bundle!",
    slug: "launch-bundle",
    image: launchBundlePricing.value?.image ,
    price: launchBundlePricing.value?.formattedSalePrice || "$109",
    originalPrice: launchBundlePricing.value?.formattedOriginalPrice || "$256",
    alt: "Launch Bundle!",
    href: "/launch-bundle", // Route to plugins page since bundle doesn't exist as individual product
  },*/
  {
    name: "Everything Bundle",  
    slug: "everything-bundle",
    image: "/images/products/plugins/everything-bundle-no-bg.png",
    price: everythingBundlePricing.value?.formattedSalePrice || "$109",
    originalPrice: everythingBundlePricing.value?.formattedOriginalPrice || "$256",
    alt: "Everything Bundle",
    href: "/bundles/everything-bundle",
  },
  
  {
    name: "Oak Dynamic Tone Shaper",
    slug: "oak-dynamic-tone-shaper",
    image: "/images/products/plugins/3d/oak-side-hero.jpg",
    price: "$79",
    originalPrice: "$99",
    alt: "Oak Dynamic Tone Shaper",
    href: "/plugins/oak-dynamic-tone-shaper",
  },
  {
    name: "Cactus Clipper Bundle",
    slug: "cactus-clipper",
    image: "/images/products/plugins/3d/Cactus_Side-nobg.png",
    price: cactusBundlePricing.value?.formattedSalePrice || "$39",
    originalPrice: cactusBundlePricing.value?.formattedOriginalPrice || "$49",
    alt: "Cactus Clipper Bundle",
    href: "/plugins/cactus-clipper",
  },
  /*{
    name: "Spice",
    slug: "spice",
    image: "/images/backgrounds/spice-spooky.png",
    price: "$19",
    originalPrice: "$29",
    alt: "Spice",
    href: "/plugins/spice",
  },*/
  
]);

// Get dynamic pricing for current product
const getCurrentProductPricing = (product: any) => {
  const mergedProduct = getMergedProduct(product.slug);
  if (mergedProduct && hasProductData.value) {
    return {
      price: mergedProduct.salePrice || mergedProduct.price,
      originalPrice: mergedProduct.salePrice ? mergedProduct.price : null,
    };
  }
  // Return static pricing while loading or if no AudioLoom data
  return {
    price: hasProductData.value ? product.price : "$--",
    originalPrice: hasProductData.value ? product.originalPrice : null,
  };
};

// Reactive state for current product
const currentProductSlug = ref(featuredProducts.value[0].slug);
const currentProduct = computed(
  () =>
    featuredProducts.value.find((p) => p.slug === currentProductSlug.value) ||
    featuredProducts.value[0],
);

// Animation state
const isVisible = ref(false);

// Auto-rotate every 6 seconds
let interval: NodeJS.Timeout;

onMounted(() => {
  // Trigger animations immediately for hero section
  isVisible.value = true;
  
  interval = setInterval(() => {
    const currentIndex = featuredProducts.value.findIndex(
      (p) => p.slug === currentProductSlug.value,
    );
    const nextIndex = (currentIndex + 1) % featuredProducts.value.length;
    currentProductSlug.value = featuredProducts.value[nextIndex].slug;
  }, 6000);
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});
</script>

<template>
  <div class="relative lg:h-screen w-full bg-black overflow-hidden">
    <!-- Content Layer -->
    <div class="relative z-10 flex flex-col h-full">
      <!-- Spacer for navbar -->
      <div class="h-[104px] lg:h-[120px] shrink-0"></div>

      <!-- Main content container that fills remaining space -->
      <div class="flex-1 relative w-full">
        <!-- Desktop: Regular product images positioned absolutely in bottom left corner -->
        <div class="hidden lg:block absolute bottom-0 left-0 w-5/8 h-full z-10">
          <NuxtImg
            v-for="(product, index) in featuredProducts.filter(
              (p) => p.slug !== 'launch-bundle',
            )"
            :key="product.slug"
            :src="product.image"
            :alt="product.alt"
            fetchpriority="high"
            class="absolute inset-0 w-full h-full object-contain object-bottom transition-opacity duration-1000 ease-in-out"
            :class="{
              'opacity-100':
                product.slug === currentProductSlug &&
                currentProduct.slug !== 'launch-bundle',
              'opacity-0':
                product.slug !== currentProductSlug ||
                currentProduct.slug === 'launch-bundle',
            }"
          />
        </div>

        <!-- Desktop: Bundle image positioned in center -->
        <div
          class="hidden lg:flex absolute bottom-0 left-0 w-5/8 h-full z-10 items-center justify-center"
        >
          <NuxtImg
            v-for="(product, index) in featuredProducts.filter(
              (p) => p.slug === 'launch-bundle',
            )"
            :key="product.slug"
            :src="product.image"
            :alt="product.alt"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
            :class="{
              'opacity-100': currentProduct.slug === 'launch-bundle',
              'opacity-0': currentProduct.slug !== 'launch-bundle',
            }"
          />
        </div>

        <!-- Desktop: Content positioned in right half -->
        <div
          class="hidden lg:flex absolute right-0 top-0 w-1/2 h-full items-center justify-center px-8 py-12 z-20"
        >
          <div class="max-w-2xl w-full">
            <h1
              class="text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-center lg:text-left text-white mb-12 transition-all duration-700 ease-out"
              :class="{
                'opacity-100 translate-y-0': isVisible,
                'opacity-0 translate-y-8': !isVisible
              }"
            >
              explore your new sonic palette
            </h1>
            <div class="lg:w-fit">
              <p
                class="text-center text-lg lg:text-left text-white/80 lg:text-xl 2xl:text-2xl transition-all duration-700 ease-out"
                :class="{
                  'opacity-100 translate-y-0': isVisible,
                  'opacity-0 translate-y-8': !isVisible
                }"
                :style="{ 
                  transitionDelay: isVisible ? '0.2s' : '0s'
                }"
              >
                audio tools designed to help you leave your signature
              </p>
              <div
                class="flex flex-col sm:flex-row w-full justify-center gap-4 lg:justify-between lg:gap-4 mt-6 lg:mt-12 transition-all duration-700 ease-out"
                :class="{
                  'opacity-100 translate-y-0': isVisible,
                  'opacity-0 translate-y-8': !isVisible
                }"
                :style="{ 
                  transitionDelay: isVisible ? '0.4s' : '0s'
                }"
              >
                <UButton
                  color="primary"
                  variant="solid"
                  size="xl"
                  trailing-icon="i-heroicons-arrow-right"
                  class="rounded-full justify-center w-full sm:w-auto"
                  to="/plugins"
                  >shop plugins</UButton
                >
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xl"
                  trailing-icon="i-heroicons-arrow-right"
                  class="rounded-full justify-center w-full sm:w-auto"
                  to="/samples"
                  >shop samples</UButton
                >
              </div>
              <div 
                class="flex justify-center mt-32 transition-all duration-700 ease-out"
                :class="{
                  'opacity-100 translate-y-0': isVisible,
                  'opacity-0 translate-y-8': !isVisible
                }"
                :style="{ 
                  transitionDelay: isVisible ? '0.6s' : '0s'
                }"
              >
                <div class="relative w-full max-w-md flex justify-center">
                  <ULink
                    v-for="product in featuredProducts"
                    :key="product.slug"
                    :to="product.href"
                    class="text-white/80 hover:text-white/60 transition-all duration-300 absolute transition-opacity duration-1000 ease-in-out"
                    :class="{
                      'opacity-100 z-10': product.slug === currentProductSlug,
                      'opacity-0 z-0': product.slug !== currentProductSlug,
                    }"
                  >
                    <div
                      class="rounded-xl border-glass-2xl border-white/10 flex flex-row p-4 gap-4 items-center transition-all duration-300 hover:bg-white/5"
                    >
                      <p class="flex-1">
                        {{ product.name }} -
                        {{ getCurrentProductPricing(product).price }}
                        <span
                          v-if="getCurrentProductPricing(product).originalPrice"
                          class="line-through text-white/50 ml-1"
                          >{{
                            getCurrentProductPricing(product).originalPrice
                          }}</span
                        >
                        <!-- Show loading indicator if no product data yet -->
                        <span v-if="!hasProductData" class="ml-1 text-white/50">
                          <UIcon
                            name="i-heroicons-arrow-path"
                            class="animate-spin w-4 h-4 inline"
                          />
                        </span>
                      </p>
                      <UIcon
                        name="i-heroicons-chevron-right"
                        class="flex-shrink-0"
                      />
                    </div>
                  </ULink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile/Tablet: Content positioned at top -->
        <div
          class="lg:hidden flex flex-col items-center justify-start px-8 pt-12 w-full mb-24"
        >
          <div class="max-w-2xl w-full text-center">
            <h1
              class="text-4xl sm:text-5xl font-bold text-center text-white mb-8 transition-all duration-700 ease-out"
              :class="{
                'opacity-100 translate-y-0': isVisible,
                'opacity-0 translate-y-8': !isVisible
              }"
            >
              explore your new sonic palette
            </h1>
            <div class="w-full flex flex-col items-center">
              <p 
                class="text-center text-lg text-white/80 mb-8 transition-all duration-700 ease-out"
                :class="{
                  'opacity-100 translate-y-0': isVisible,
                  'opacity-0 translate-y-8': !isVisible
                }"
                :style="{ 
                  transitionDelay: isVisible ? '0.2s' : '0s'
                }"
              >
                audio tools designed to help you leave your signature
              </p>
              <div
                class="flex flex-col sm:flex-row w-full justify-center gap-4 transition-all duration-700 ease-out"
                :class="{
                  'opacity-100 translate-y-0': isVisible,
                  'opacity-0 translate-y-8': !isVisible
                }"
                :style="{ 
                  transitionDelay: isVisible ? '0.4s' : '0s'
                }"
              >
                <UButton
                  color="primary"
                  variant="solid"
                  size="xl"
                  trailing-icon="i-heroicons-arrow-right"
                  class="rounded-full justify-center w-full sm:w-auto"
                  to="/plugins"
                  >shop plugins</UButton
                >
                <UButton
                  color="neutral"
                  variant="outline"
                  size="xl"
                  trailing-icon="i-heroicons-arrow-right"
                  class="rounded-full justify-center w-full sm:w-auto"
                  to="/samples"
                  >shop samples</UButton
                >
              </div>

              <!-- Featured Product Link -->
              <div 
                class="flex justify-center mt-8 transition-all duration-700 ease-out"
                :class="{
                  'opacity-100 translate-y-0': isVisible,
                  'opacity-0 translate-y-8': !isVisible
                }"
                :style="{ 
                  transitionDelay: isVisible ? '0.6s' : '0s'
                }"
              >
                <div class="relative w-full max-w-2xl">
                  <ULink
                    v-for="product in featuredProducts"
                    :key="product.slug"
                    :to="product.href"
                    class="text-white/80 hover:text-white/60 transition-all duration-300 block transition-opacity duration-1000 ease-in-out"
                    :class="{
                      'opacity-100 z-10': product.slug === currentProductSlug,
                      'opacity-0 absolute top-0 left-0 right-0 z-0':
                        product.slug !== currentProductSlug,
                    }"
                  >
                    <div
                      class="rounded-xl border-glass-2xl border-white/10 flex flex-row p-4 gap-4 items-center transition-all duration-300 hover:bg-white/5"
                    >
                      <p class="text-sm flex-1">
                        {{ product.name }} -
                        {{ getCurrentProductPricing(product).price }}
                        <span
                          v-if="getCurrentProductPricing(product).originalPrice"
                          class="line-through text-white/50 ml-1"
                          >{{
                            getCurrentProductPricing(product).originalPrice
                          }}</span
                        >
                        <!-- Show loading indicator if no product data yet -->
                        <span v-if="!hasProductData" class="ml-1 text-white/50">
                          <UIcon
                            name="i-heroicons-arrow-path"
                            class="animate-spin w-4 h-4 inline"
                          />
                        </span>
                      </p>
                      <UIcon
                        name="i-heroicons-chevron-right"
                        class="flex-shrink-0"
                      />
                    </div>
                  </ULink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile/Tablet: Image positioned below content -->
        <div class="lg:hidden relative w-full mt-24">
          <div class="relative w-full">
            <NuxtImg
              v-for="(product, index) in featuredProducts"
              :key="product.slug"
              :src="product.image"
              :alt="product.alt"
              class="absolute inset-0 w-full h-full object-contain object-bottom transition-opacity duration-1000 ease-in-out"
              :class="{
                'opacity-100': product.slug === currentProductSlug,
                'opacity-0': product.slug !== currentProductSlug,
              }"
            />
            <!-- Spacer to maintain layout -->
            <div class="w-full h-64"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
