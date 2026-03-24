export function useLogout() {
  const { fetch: fetchSession } = useUserSession();

  async function performLogout() {
    await $fetch("/api/logout", { method: "POST" });
    await fetchSession();
  }

  return { performLogout };
}
