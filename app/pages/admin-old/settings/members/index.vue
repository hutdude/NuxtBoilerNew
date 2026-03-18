<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["unauthenticated"],
});

const { user } = useUserSession();
</script>

<template>
  <div class="space-y-2">
    <h1 class="text-2xl font-semibold">Members</h1>
    <p class="text-sm text-muted">Signed in as {{ user.name }}</p>
  </div>
</template>

