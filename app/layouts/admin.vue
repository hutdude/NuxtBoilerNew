<script setup lang="ts">
const route = useRoute();
const toast = useToast();

const open = ref(false);

const links = [
  [
    {
      label: "Home",
      icon: "i-lucide-house",
      to: "/admin",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Audioloom",
      icon: "i-custom-audioloom",
      to: "/admin/inbox",
      badge: "4",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Customers",
      icon: "i-lucide-users",
      to: "/admin/customers",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Settings",
      to: "/admin/settings",
      icon: "i-lucide-settings",
      defaultOpen: true,    
      type: "trigger",
      children: [
        {
          label: "General",
          to: "/admin/settings",
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Members",
          to: "/admin/settings/members",
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Notifications",
          to: "/admin/settings/notifications",
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Security",
          to: "/admin/settings/security",
          onSelect: () => {
            open.value = false;
          },
        },
      ],
    },
  ],
] satisfies NavigationMenuItem[][];
//
const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links.flat(),
  },
  {
    id: "code",
    label: "Code",
    items: [
      {
        id: "source",
        label: "View page source",
        icon: "i-simple-icons-github",
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === "/" ? "/index" : route.path}.vue`,
        target: "_blank",
      },
    ],
  },
]);
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <AdminUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>

<style scoped></style>
