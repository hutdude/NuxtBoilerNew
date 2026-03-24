<template>
  <UPageHero
      :title="title"
      :description="description"
    />
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  }
})
</script>
