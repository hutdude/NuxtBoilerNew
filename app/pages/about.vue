<script setup lang="ts">
const { data: page } = await useAsyncData("about-page", () =>
  queryCollection("content").path("/about").first(),
);

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page not found",
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
        <ContentRenderer v-if="page" :value="page" class="prose prose-neutral dark:prose-invert max-w-none" />
      </UContainer>
    </UPageBody>
  </UPage>
</template>
