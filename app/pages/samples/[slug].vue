<script setup lang="ts">
definePageMeta({
  layout: "default",
  middleware: ["product-available"],
});

const { mergedProducts, catalogReady } = useAudioloomCatalog();

const { loggedIn } = useUserSession();

const route = useRoute();
const slug = computed(() => {
  const p = route.params.slug;
  const raw = Array.isArray(p) ? p[0] : p;
  return typeof raw === "string" && raw.length > 0 ? raw : "";
});

/** Sample-pack product only (URL segment = audioloom id). */
const productData = computed(() => {
  if (!catalogReady.value) {
    return undefined;
  }
  const id = slug.value;
  return mergedProducts.value.find((p) => p.id === id);
});

const toast = useToast();

const warnedSlug = ref<string | null>(null);

watch(
  [catalogReady, loggedIn, slug, productData],
  () => {
    if (!import.meta.client) {
      return;
    }
    if (!catalogReady.value || !loggedIn.value) {
      return;
    }
    const row = productData.value;
    if (!row || row.site.visible) {
      return;
    }
    const s = slug.value;
    if (!s || warnedSlug.value === s) {
      return;
    }
    warnedSlug.value = s;
    toast.add({
      title: "PDP not currently available to users",
      description: "Only signed-in staff can preview this page.",
      icon: "i-lucide-alert-circle",
      color: "warning",
    });
  },
  { flush: "post" },
);

const pageKey = computed(() => `sample-pack-${slug.value}`);

const { data: page } = await useAsyncData(
  pageKey,
  () =>
    queryCollection("content")
      .where("stem", "=", `products/sample-packs/${slug.value}`)
      .first(),
  { watch: [slug] },
);

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Sample pack not found",
  });
}

useSeoMeta({
  title: page.value.title,
  description: page.value.description,
});
</script>

<template>
  <UPage>
    <UPageHeader :title="page.title" :description="page.description" />

    <UPageBody>
      <UContainer>
        <ContentRenderer
          v-if="page"
          :value="page"
          class="prose prose-neutral dark:prose-invert max-w-none"
        />
      </UContainer>
    </UPageBody>
  </UPage>
</template>
