<!-- pages/[...app].vue -->

<script setup>
import { Content, fetchOneEntry, isPreviewing } from '@builder.io/sdk-vue';
import { ref } from 'vue';

const route = useRoute();

// TO DO: Add your Public API Key here
const apiKey = /* your API key here */;
const canShowContent = ref(false);
const model = 'page';

const { data: content } = await useAsyncData('builderData', () =>
  fetchOneEntry({
    model,
    apiKey,
    userAttributes: {
      urlPath: route.path,
    },
  })
);

canShowContent.value = content.value ? true : isPreviewing(route.path);
</script>

<template>
  <div v-if="canShowContent">
    <Content :api-key="b06931e1c37d497b90b111f3ee1526fc" :model="model" :content="content" />
  </div>
  <div v-else>Content not Found</div>
</template>