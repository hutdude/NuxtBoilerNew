<script setup lang="ts">
const { data: page, error } = await useAsyncData("about-page", () =>
  queryContentFirstByPath("/about"),
)

if (error.value) {
  throw createError({
    statusCode: 503,
    statusMessage: "Content is temporarily unavailable",
    cause: error.value,
  })
}

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Page not found",
  })
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
