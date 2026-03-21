// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "nuxt-auth-utils",
    "nuxt-studio",
    "@nuxt/content",
  ],

  studio: {
    route: "/admin",
  },

  icon: {
    customCollections: [
      {
        prefix: "custom",
        dir: "./app/assets/icons",
      },
    ],
  },

  devtools: {
    enabled: true,
  },

  css: ["~/assets/css/main.css"],

  routeRules: {
    "/": { prerender: true },
  },

  compatibilityDate: "2025-01-15",

  // https://nuxt.com/docs/4.x/guide/going-further/runtime-config
  // Defaults here; override at runtime with NUXT_PUBLIC_* (e.g. .env — not read by built server alone).
  runtimeConfig: {
    public: {
      audioloom: {
        scriptSrc: "https://assets.audioloom.com/storefront/audioloom.js",
        clientId: "",
        creatorId: "",
      },
    },
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
});
