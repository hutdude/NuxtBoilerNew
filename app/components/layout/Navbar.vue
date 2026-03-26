<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type {
  MergedAudioloomBundle,
  MergedAudioloomProduct,
} from "../../../types/audioloom-catalog";

const navOpen = ref(false);

const {
  catalogReady,
  visibleMergedProducts,
  visibleMergedBundles,
} = useAudioloomCatalog();

/** Card row for nav dropdowns + `LayoutNavProductItem` (expects slug, href, image, names). */
type NavbarCatalogItem = {
  id: string;
  slug: string;
  name: string;
  dynamicName: string;
  href: string;
  image: string;
  iconUrl: string;
  kind: "product" | "bundle";
  sortKey: number;
};

const NAV_PRIORITY_IDS = [
  "black-friday-bundle",
  "subtec",
  "cactus-clipper-bundle",
] as const;

function slugFromSdkProduct(p: MergedAudioloomProduct): string {
  const ext = p as Record<string, unknown>;
  const s = ext.slug;
  if (typeof s === "string" && s.length > 0) {
    return s;
  }
  return p.id;
}

/**
 * Prefer `site.productCategory` from Neon (`audioloom_product_metadata`); fall back to SDK heuristics.
 */
function isSampleProduct(p: MergedAudioloomProduct): boolean {
  if (p.site.hasMetadataRow && p.site.productCategory === "sample-pack") {
    return true;
  }
  if (p.site.hasMetadataRow && p.site.productCategory === "plugin") {
    return false;
  }
  const ext = p as Record<string, unknown>;
  const t = ext.productSubType ?? ext.subType ?? ext.category ?? ext.listingCategory;
  if (t === "sample" || t === "samples") {
    return true;
  }
  if (ext.isSample === true) {
    return true;
  }
  const tags = ext.tags;
  if (
    Array.isArray(tags)
    && tags.some((x) => String(x).toLowerCase() === "sample")
  ) {
    return true;
  }
  if (typeof tags === "string" && tags.toLowerCase().includes("sample")) {
    return true;
  }
  return false;
}

function bundleHref(b: MergedAudioloomBundle): string {
  return b.id === "cactus-clipper-bundle"
    ? "/plugins/cactus-clipper"
    : `/bundles/${b.id}`;
}

function toNavItemFromProduct(
  p: MergedAudioloomProduct,
  href: string,
): NavbarCatalogItem {
  const slug = slugFromSdkProduct(p);
  return {
    id: p.id,
    slug,
    name: p.name,
    dynamicName: p.name,
    href,
    image: p.iconUrl,
    iconUrl: p.iconUrl,
    kind: "product",
    sortKey: p.site.sortOrder ?? 999,
  };
}

function toNavItemFromBundle(b: MergedAudioloomBundle): NavbarCatalogItem {
  return {
    id: b.id,
    slug: b.id,
    name: b.name,
    dynamicName: b.name,
    href: bundleHref(b),
    image: b.iconUrl,
    iconUrl: b.iconUrl,
    kind: "bundle",
    sortKey: b.site.sortOrder ?? 999,
  };
}

function applyNavPriority(items: NavbarCatalogItem[]): NavbarCatalogItem[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const priority: NavbarCatalogItem[] = [];
  for (const id of NAV_PRIORITY_IDS) {
    const it = byId.get(id);
    if (it) {
      priority.push(it);
    }
  }
  const priorityIds = new Set(priority.map((i) => i.id));
  const rest = items.filter((i) => !priorityIds.has(i.id));
  rest.sort((a, b) => {
    if (a.sortKey !== b.sortKey) {
      return a.sortKey - b.sortKey;
    }
    return a.name.localeCompare(b.name);
  });
  return [...priority, ...rest];
}

// Plugins dropdown: visible storefront products (non-sample) + bundles; DB `sortOrder` + legacy pin order
const navPluginsAndBundles = computed((): NavbarCatalogItem[] => {
  if (!catalogReady.value) {
    return [];
  }
  const plugins = visibleMergedProducts.value
    .filter((p) => !isSampleProduct(p))
    .map((p) =>
      toNavItemFromProduct(p, `/plugins/${slugFromSdkProduct(p)}`),
    );
  const bundles = visibleMergedBundles.value.map(toNavItemFromBundle);
  return applyNavPriority([...plugins, ...bundles]);
});

const navSamples = computed((): NavbarCatalogItem[] => {
  if (!catalogReady.value) {
    return [];
  }
  return visibleMergedProducts.value
    .filter(isSampleProduct)
    .map((p) => toNavItemFromProduct(p, `/samples/${slugFromSdkProduct(p)}`))
    .sort((a, b) => {
      if (a.sortKey !== b.sortKey) {
        return a.sortKey - b.sortKey;
      }
      return a.name.localeCompare(b.name);
    });
});

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

// Preload images for better performance
const preloadImages = () => {
  if (!catalogReady.value) {
    return;
  }

  navPluginsAndBundles.value.forEach((item) => {
    if (item.image && item.image !== "Product Image") {
      const img = new Image();
      img.src = item.image;
    }
  });

  navSamples.value.forEach((sample) => {
    if (sample.image && sample.image !== "Product Image") {
      const img = new Image();
      img.src = sample.image;
    }
  });
};

watch(
  catalogReady,
  (ready) => {
    if (ready) {
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
      ...navPluginsAndBundles.value.map((item) => ({
        label: item.dynamicName || item.name,
        to: item.href,
        active: route.path.startsWith(item.href),
      })),
    ],
  },

  {
    label: "samples",
    to: "/samples",
    active: false,
    slot: "samples" as const,
    children: [
      ...navSamples.value.map((sample) => ({
        label: sample.dynamicName || sample.name,
        to: sample.href,
        active: route.path.startsWith(sample.href),
      })),
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
                <template v-if="!catalogReady">
                  <div
                    v-for="(_, index) in loadingPlugins"
                    :key="`loading-plugin-${index}`"
                    class="flex-shrink-0"
                  >
                    <LayoutNavProductItem :loading="true" />
                  </div>
                </template>

                <template v-else>
                  <div
                    v-for="plugin in navPluginsAndBundles"
                    :key="plugin.id"
                    class="flex-shrink-0"
                  >
                    <LayoutNavProductItem
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
                <template v-if="!catalogReady">
                  <div
                    v-for="(_, index) in loadingSamples"
                    :key="`loading-sample-${index}`"
                    class="flex-shrink-0"
                  >
                    <LayoutNavProductItem :loading="true" />
                  </div>
                </template>

                <template v-else>
                  <div
                    v-for="sample in navSamples"
                    :key="sample.id"
                    class="flex-shrink-0"
                  >
                    <LayoutNavProductItem
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

    <NuxtLink to="/">
      <AppLogo class="w-auto h-6 shrink-0" />
    </NuxtLink>

    <template #right>
      <div class="flex justify-center gap-2">
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
          <div class="p-2 space-y-6">
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
                    <template v-if="!catalogReady">
                      <div
                        v-for="(_, index) in loadingPlugins"
                        :key="`loading-plugin-${index}`"
                        class="flex-shrink-0"
                      >
                        <LayoutNavProductItem :loading="true" />
                      </div>
                    </template>

                    <!-- Show actual products once loaded -->
                    <template v-else>
                      <div
                        v-for="plugin in navPluginsAndBundles"
                        :key="plugin.id"
                        class="flex-shrink-0"
                      >
                        <LayoutNavProductItem :product="plugin" />
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
                    <template v-if="!catalogReady">
                      <div
                        v-for="(_, index) in loadingSamples"
                        :key="`loading-sample-${index}`"
                        class="flex-shrink-0"
                      >
                        <LayoutNavProductItem :loading="true" />
                      </div>
                    </template>

                    <!-- Show actual products once loaded -->
                    <template v-else>
                      <div
                        v-for="sample in navSamples"
                        :key="sample.id"
                        class="flex-shrink-0"
                      >
                        <LayoutNavProductItem :product="sample" />
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
