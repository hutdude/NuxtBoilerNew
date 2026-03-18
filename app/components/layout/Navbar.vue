<script setup lang="ts">
declare global {
  interface Window {
    Audioloom: any;
  }
}
import type { NavigationMenuItem } from "@nuxt/ui";
const navOpen = ref(false);

const { getMergedProductsByType, hasAudioLoomData, hasProductData, getAllBundles } =
  useAudioLoomIntegration();

const route = useRoute();
interface User {
  name: string;
}
const user = ref<User | null>(null);

// Active navigation item to control dropdown state
const active = ref<string | undefined>();

// Watch for navigation menu open state
watch(active, (newActive) => {
  navOpen.value = !!newActive;
});

// Create computed properties for products to avoid duplicate calls
const availablePlugins = computed(() => {
  const plugins = getMergedProductsByType("plugin").filter(
    (plugin) => plugin.available,
  );
  return plugins;
});

const allSamples = computed(() => {
  const samples = getMergedProductsByType("sample");
  return samples;
});

// Get all bundles
const allBundles = computed(() => getAllBundles());


// Combined plugins and bundles for the plugins dropdown, sorted by sort-id
const combinedPluginsAndBundles = computed(() => {
  const plugins = availablePlugins.value.map(plugin => ({
    ...plugin,
    type: 'plugin' as const,
    sortId: (plugin as any)['sort-id'] || 999, // Default sort-id for plugins without it
    href: plugin.href
  }));
  
  const bundles = allBundles.value.map(bundle => ({
    ...bundle,
    id: parseInt(bundle.id) || 999, // Convert string id to number
    type: 'bundle' as const,
    sortId: bundle['sort-id'] || 999, // Default sort-id for bundles without it
    href: bundle.slug === 'cactus-clipper-bundle' ? '/plugins/cactus-clipper' : `/bundles/${bundle.slug}`,
    dynamicName: bundle.name,
    dynamicDescription: bundle.description,
    freeTrialDownloadLink: '',
    iconUrl: bundle.image,
    pricing: bundle.pricing ? {
      id: bundle.pricing.pricingConfiguration.id,
      name: bundle.pricing.pricingConfiguration.name,
      originalPrice: bundle.pricing.pricingConfiguration.originalPrice,
      price: bundle.pricing.pricingConfiguration.price,
      hasDiscount: bundle.pricing.pricingConfiguration.hasDiscount
    } : null,
    // Add missing properties for MergedProduct compatibility
    price: `$${bundle.originalPrice}`,
    salePrice: bundle.savings > 0 ? `$${bundle.salePrice}` : undefined,
    tags: ['bundle', 'discount'],
    featuredFeatures: [
      `All ${bundle.includedProducts.length} plugins included`,
      `${bundle.savingsPercentage}% savings`,
      'Complete collection',
    ],
    features: []
  }));
  
  // Combine and prioritize specific items
  const combined = [...plugins, ...bundles];
  
  // Find priority items: black-friday-bundle first, then subtec, then cactus-clipper-bundle
  const blackFridayBundle = combined.find(item => item.slug === "black-friday-bundle");
  const subtecPlugin = combined.find(item => item.slug === "subtec");
  const cactusBundle = combined.find(item => item.slug === "cactus-clipper-bundle");
  const otherItems = combined.filter(
    item => item.slug !== "black-friday-bundle" && item.slug !== "subtec" && item.slug !== "cactus-clipper-bundle"
  );
  
  // Build priority order
  const priorityItems = [];
  if (blackFridayBundle) priorityItems.push(blackFridayBundle);
  if (subtecPlugin) priorityItems.push(subtecPlugin);
  if (cactusBundle) priorityItems.push(cactusBundle);
  
  return [...priorityItems, ...otherItems.sort((a, b) => a.sortId - b.sortId)];
});

// Memoize the product arrays to prevent unnecessary re-computations
const memoizedPlugins = computed(() => {
  if (!pluginsLoaded.value) return [];
  return combinedPluginsAndBundles.value;
});

const memoizedSamples = computed(() => {
  if (!samplesLoaded.value) return [];
  return allSamples.value;
});

// Pre-load product data to avoid re-rendering
const pluginsLoaded = ref(false);
const samplesLoaded = ref(false);

// Watch for product data and mark as loaded
watch(
  hasProductData,
  (hasData) => {
    if (hasData) {
      pluginsLoaded.value = true;
      samplesLoaded.value = true;
    }
  },
  { immediate: true },
);

// Preload images for better performance
const preloadImages = () => {
  if (!hasProductData.value) return;

  // Preload plugin and bundle images
  combinedPluginsAndBundles.value.forEach((item) => {
    if (item.image && item.image !== "Product Image") {
      const img = new Image();
      img.src = item.image;
    }
  });

  // Preload sample images
  allSamples.value.forEach((sample) => {
    if (sample.image && sample.image !== "Product Image") {
      const img = new Image();
      img.src = sample.image;
    }
  });
};

// Preload images when data is available
watch(
  hasProductData,
  (hasData) => {
    if (hasData) {
      // Small delay to ensure DOM is ready
      nextTick(() => {
        preloadImages();
      });
    }
  },
  { immediate: true },
);

// Loading skeleton arrays
const loadingPlugins = Array(6).fill(null); // Increased to account for bundles
const loadingSamples = Array(2).fill(null);

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: "plugins",
    to: "/plugins",
    active: false,
    slot: "plugins" as const,
    children: [
      // Dynamic plugin and bundle links from JSON - sorted by sort-id
      ...combinedPluginsAndBundles.value.map((item) => ({
        label: item.dynamicName || item.name,
        to: item.href,
        active: route.path.startsWith(item.href),
      })),
      // Separator and "View All" option
    ],
  },

  {
    label: "samples",
    to: "/samples",
    active: false,
    slot: "samples" as const,
    children: [
      // Dynamic sample links from JSON
      ...allSamples.value.map((sample) => ({
        label: sample.dynamicName || sample.name,
        to: sample.href,
        active: route.path.startsWith(sample.href),
      })),
      // Separator and "View All" option
    ],
  },

  {
    label: "about",
    to: "/about",
    active: false,
    class: "hidden lg:flex",
  },
  {
    label: "support",
    to: "/support",
    active: false,
    class: "hidden lg:flex",
  },
]);

const OpenCart = async () => {
  if (typeof window !== "undefined" && window.Audioloom) {
    window.Audioloom.view_cart();
  }
};

const ViewAccount = () => {
  if (typeof window !== "undefined" && window.Audioloom) {
    window.Audioloom.view_account();
  }
};

// Function to close the navigation dropdown
const closeNavigation = () => {
  active.value = undefined;
};
</script>

<template>
  <UHeader
    :toggle="{
      color: 'neutral',
      variant: 'ghost',
      size: 'xl',
      class: 'rounded-xl h-full',
    }"
    mode="slideover"
    toggle-side="left"
    :ui="{
      toggle: 'bg-red',
      left: 'justify-left flex-1',
      right: 'justify-right flex-1',
      root: 'bg-transparent backdrop-blur-none border-0 h-fit px-[10px] lg:px-[16px] ',
      center: 'flex justify-center flex-1',
      container: `* flex items-center bg-default shadow-md backdrop-blur h-(--ui-header-height) justify-between gap-3 max-w-none sm:px-1.5 lg:px-1.5 px-1.5 py-1.5 rounded-t-2xl rounded-r-2xl ${navOpen ? 'rounded-bl-none ' : 'rounded-bl-2xl'} border-0 transition-[border-radius] duration-200 ease-out`,
      header: 'lg:h-full bg-none',
    }"
  >
    <template #left>
      <ClientOnly>
        <UNavigationMenu
          v-model="active"
          :items="items"
          class="w-full hidden lg:flex"
          color="secondary"
          :ui="{
            viewport:
              'relative overflow-visible bg-transparent h-auto w-auto shadow-none origin-[top_center] z-[1]',
            content: 'w-auto max-w-none',
            viewportWrapper: 'absolute top-[58px] left-[-6px] flex w-auto',
            childLink: 'text-neutral-900',
          }"
        >
          <!-- Custom Plugins Dropdown Content -->
          <template #plugins-content>
            <div
              class="p-6 w-[900px] h-fit border-t-1 border-neutral-100 bg-white rounded-b-2xl shadow-lg"
            >
              <div class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 h-fit">
                <!-- Product Items or Loading Skeletons -->
                <template v-if="!pluginsLoaded">
                  <div
                    v-for="(_, index) in loadingPlugins"
                    :key="`loading-plugin-${index}`"
                    class="flex-shrink-0"
                  >
                    <UiNavProductItem :loading="true" />
                  </div>
                </template>

                <template v-else>
                  <div
                    v-for="plugin in memoizedPlugins"
                    :key="plugin.slug"
                    class="flex-shrink-0"
                  >
                    <UiNavProductItem
                      :product="plugin"
                      @close="closeNavigation"
                    />
                  </div>
                </template>
              </div>
            </div>
          </template>

          <!-- Custom Samples Dropdown Content -->
          <template #samples-content>
            <div
              class="p-6 w-[700px] border-t-1 border-neutral-100 bg-white rounded-b-2xl shadow-lg"
            >
              <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <!-- Product Items or Loading Skeletons -->
                <template v-if="!samplesLoaded">
                  <div
                    v-for="(_, index) in loadingSamples"
                    :key="`loading-sample-${index}`"
                    class="flex-shrink-0"
                  >
                    <UiNavProductItem :loading="true" />
                  </div>
                </template>

                <template v-else>
                  <div
                    v-for="sample in memoizedSamples"
                    :key="sample.slug"
                    class="flex-shrink-0"
                  >
                    <UiNavProductItem
                      :product="sample"
                      @close="closeNavigation"
                    />
                  </div>
                </template>
              </div>
            </div>
          </template>
        </UNavigationMenu>
      </ClientOnly>
    </template>

    <BrandLogo class="h-8" />

    <template #right>
      <div className="flex justify-center gap-2">
        <UButton
          label="login"
          size="lg"
          color="neutral"
          variant="ghost"
          data-audioloom-render="user.name"
          class="hover:cursor-pointer hidden rounded-xl lg:block"
          @click="ViewAccount"
        />

        <UButton
          icon="i-lucide-shopping-bag"
          size="lg"
          color="primary"
          class="hover:cursor-pointer rounded-xl h-full"
          @click="OpenCart"
        >
          <template #default>
            <span data-audioloom-render="cart.item_count">0</span>
          </template>
        </UButton>
      </div>
    </template>

    <template #body>
      <div class="flex flex-col h-[calc(100vh-100px)] justify-between">
        <!-- Navigation Menu -->
        <div class="flex-grow">
          <!-- Mobile Product Sections -->
          <div class="p-2 space-y-6 j">
            <!-- Plugins Section -->
            <div>
              <UCollapsible class="flex flex-col w-full gap-3">
                <UButton
                  label="Plugins"
                  color="neutral"
                  variant="ghost"
                  trailing-icon="i-lucide-chevron-down"
                  class="text-xl group font-bold text-neutral-950 justify-start pl-0"
                  :ui="{
                    trailingIcon:
                      'group-data-[state=open]:rotate-180 transition-transform duration-200',
                  }"
                  block
                />
                <template #content>
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <!-- Show loading skeletons initially -->
                    <template v-if="!pluginsLoaded">
                      <div
                        v-for="(_, index) in loadingPlugins"
                        :key="`loading-plugin-${index}`"
                        class="flex-shrink-0"
                      >
                        <UiNavProductItem :loading="true" />
                      </div>
                    </template>

                    <!-- Show actual products once loaded -->
                    <template v-else>
                      <div
                        v-for="plugin in memoizedPlugins"
                        :key="plugin.slug"
                        class="flex-shrink-0"
                      >
                        <UiNavProductItem :product="plugin" />
                      </div>
                    </template>
                  </div>

                  <UButton
                    label="Shop Plugins"
                    color="primary"
                    href="/plugins"
                    variant="solid"
                    size="lg"
                    trailing-icon="i-lucide-arrow-right"
                    class="font-bold text-white justify-center w-full"
                  />
                </template>
              </UCollapsible>
            </div>

            <!-- Samples Section -->
            <div>
              <UCollapsible class="flex flex-col w-full gap-3">
                <UButton
                  label="Samples"
                  color="neutral"
                  variant="ghost"
                  trailing-icon="i-lucide-chevron-down"
                  class="text-xl group font-bold text-neutral-950 justify-start pl-0"
                  :ui="{
                    trailingIcon:
                      'group-data-[state=open]:rotate-180 transition-transform duration-200',
                  }"
                  block
                />
                <template #content>
                  <div class="grid grid-cols-2 gap-4 mb-3">
                    <!-- Show loading skeletons initially -->
                    <template v-if="!samplesLoaded">
                      <div
                        v-for="(_, index) in loadingSamples"
                        :key="`loading-sample-${index}`"
                        class="flex-shrink-0"
                      >
                        <UiNavProductItem :loading="true" />
                      </div>
                    </template>

                    <!-- Show actual products once loaded -->
                    <template v-else>
                      <div
                        v-for="sample in memoizedSamples"
                        :key="sample.slug"
                        class="flex-shrink-0"
                      >
                        <UiNavProductItem :product="sample" />
                      </div>
                    </template>
                  </div>
                  <UButton
                    label="Shop Samples"
                    color="primary"
                    href="/samples"
                    variant="solid"
                    size="lg"
                    trailing-icon="i-lucide-arrow-right"
                    class="font-bold text-white justify-center w-full pb-2 border-b-1"
                  />
                </template>
              </UCollapsible>
            </div>
          </div>

          <!-- <div class="flex flex-col gap-3">
            <UButton
              label="Learn"
              to="/learn"
              color="neutral"
              variant="outline"
              class="text-xl font-bold text-neutral-950 pb-2 pt-4 w-full"
            />
          </div> -->
          <div class="flex flex-col gap-3">
            <UButton
              label="About"
              to="/about"
              color="neutral"
              variant="outline"
              class="text-xl font-bold text-neutral-950 pb-2 pt-4 w-full"
            />
          </div>
        </div>
        <div class="">
          <div class="p-4 pt-8 space-y-3 border-t border-default">
            <UButton
              :label="user ? user.name : 'Login'"
              icon="i-lucide-user"
              size="xl"
              color="neutral"
              variant="solid"
              class="rounded-full font-semibold justify-center w-full"
              @click="ViewAccount"
            />
          </div>
          <!-- Support Link -->
          <div class=" ">
            <UButton
              label="Support"
              icon="i-lucide-help-circle"
              to="/support"
              color="neutral"
              variant="outline"
              class="text-xl font-semibold text-neutral-950 pb-2 justify-center w-full"
            />
          </div>
        </div>
      </div>
    </template>
  </UHeader>
</template>
