export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession();

  // If the user is already authenticated, keep them out of auth pages.
  if (loggedIn.value) {
    return navigateTo("/admin");
  }
});
