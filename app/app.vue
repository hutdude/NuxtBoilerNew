<script setup lang="ts">
const audioloom = useAudioloom()

useHead({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: "en",
  },
});

const title = "Nuxt Starter Template";
const description =
  "A production-ready starter template powered by Nuxt UI. Build beautiful, accessible, and performant applications in minutes, not hours.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: "https://ui.nuxt.com/assets/templates/nuxt/starter-light.png",
  twitterImage: "https://ui.nuxt.com/assets/templates/nuxt/starter-light.png",
  twitterCard: "summary_large_image",
})

onMounted(() => {
  void audioloom.setup().catch((err: unknown) => {
    console.error("[AudioLoom] setup failed:", err)
  })
})
</script>

<template>
  <UApp>
    <UMain>
      <NuxtLayout class="layouts">
        <NuxtPage />
      </NuxtLayout>
    </UMain>
  </UApp>
</template>
