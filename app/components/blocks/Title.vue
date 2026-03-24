<template>
  <h1 class="text-2xl font-bold">
    {{ title }}
  </h1>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: "",
  },
});
</script>
