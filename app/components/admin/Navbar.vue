<script setup lang="ts">
const { user } = useUserSession();
const { performLogout } = useLogout();

async function logout() {
  await performLogout();
  await navigateTo("/login");
}
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/admin">
        <AppLogo class="w-auto h-6 shrink-0" />
      </NuxtLink>

      <span class="ml-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {{ user.name }}
      </span>
    </template>

    <template #right>
      <UColorModeButton />

      <UButton @click="logout" icon="i-lucide-log-out"> Logout </UButton>
    </template>
  </UHeader>
</template>
