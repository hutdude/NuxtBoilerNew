<script setup lang="ts">
definePageMeta({
  middleware: ["authenticated"],
});

const { fetch: refreshSession } = useUserSession();
const credentials = reactive({
  email: "",
  password: "",
});
async function login() {
  try {
    await $fetch("/api/login", {
      method: "POST",
      body: credentials,
    });

    // Refresh the session on client-side and redirect to admin
    await refreshSession();
    await navigateTo("/admin");
  } catch {
    alert("Bad credentials");
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold">Login</span>
        </div>
      </template>

      <form @submit.prevent="login" class="space-y-4">
        <UInput v-model="credentials.email" type="email" placeholder="Email" />
        <UInput
          v-model="credentials.password"
          type="password"
          placeholder="Password"
        />
        <UButton type="submit" block>Login</UButton>
      </form>
    </UCard>
  </div>
</template>
