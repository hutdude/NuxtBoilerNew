declare module "#auth-utils" {
  interface User {
    name: string;
    avatar?: {
      src: string;
      alt: string;
    };
  }
}

