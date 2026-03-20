<script setup lang="ts">
import type {
  CommandPaletteItem,
  CommandPaletteGroup,
  NavigationMenuItem,
} from "@nuxt/ui";

const route = useRoute();

const { waitForProducts, products } = useAudioloom();

onMounted(() => {
  void waitForProducts();
});

const open = ref(false);

// keeps audioloom panel active on dynamic routes
const isAudioloomSection = (path: string) =>
  path === "/admin/audioloom" || path.startsWith("/admin/audioloom/");

const links = computed<NavigationMenuItem[][]>(() => [
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
      to: "/admin/audioloom",
      badge: products.value.length ? String(products.value.length) : undefined,
      active: isAudioloomSection(route.path),
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
]);

const groups = computed((): CommandPaletteGroup<CommandPaletteItem>[] => {
  const out: CommandPaletteGroup<CommandPaletteItem>[] = [
    {
      id: "links",
      label: "Go to",
      // NavigationMenuItem is a superset; palette items differ on `chip` typing.
      items: links.value.flat() as CommandPaletteItem[],
    },
  ];
  if (products.value.length > 0) {
    out.push({
      id: "products",
      label: "Products",
      items: products.value.map((product) => ({
        id: product.id,
        label: product.name,
        icon: "i-lucide-package",
        to: `/admin/audioloom/${product.id}`,
      })),
    });
  }
  return out;
});
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
      </template>

      <template #footer="{ collapsed }">
        <AdminUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" :fuse="{ resultLimit: 42 }" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>

<style scoped></style>
