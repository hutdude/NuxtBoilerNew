declare module "nuxt/schema" {
  interface PublicRuntimeConfig {
    audioloom: {
      scriptSrc: string;
      clientId: string;
      creatorId: string;
    };
  }
}

export {};
