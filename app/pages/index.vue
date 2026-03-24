<script setup lang="ts">
const { data: page, error } = await useAsyncData("index-content", () =>
  queryContentFirstByPath("/"),
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
  title: computed(() => page.value?.title ?? ""),
  description: computed(() => page.value?.description ?? ""),
});
</script>

<template>
  <UPage>
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
