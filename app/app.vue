<script setup lang="ts">
const audioloomCatalog = useAudioloomCatalog()

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'Nuxt Starter Template'
const description
  = 'A production-ready starter template powered by Nuxt UI. Build beautiful, accessible, and performant applications in minutes, not hours.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
})

onMounted(async () => {
  try {
    await audioloomCatalog.setup()
    await audioloomCatalog.syncCatalog()
  } catch (err: unknown) {
    console.error('[AudioLoom] setup or catalog sync failed:', err)
  }
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
