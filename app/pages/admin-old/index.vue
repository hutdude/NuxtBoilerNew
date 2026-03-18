<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["unauthenticated"],
});

const { user } = useUserSession();
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Home">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <h1>Welcome {{ user.name }}</h1>
    </template>
  </UDashboardPanel>
</template>
