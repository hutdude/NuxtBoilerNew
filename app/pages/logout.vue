<script setup lang="ts">
const { performLogout } = useLogout();

onMounted(async () => {
  await performLogout();
  await navigateTo("/login");
});
</script>

<template>
  <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center p-6">
    <p class="text-muted text-sm">Signing you out…</p>
  </div>
</template>
