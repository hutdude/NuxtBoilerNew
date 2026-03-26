import { join } from "node:path";

import type { AudioloomProductCategory } from "../../types/audioloom-product-metadata";

export function contentDir(): string {
  return join(process.cwd(), "content");
}

/** Canonical PDP path for a storefront product (`content/products/plugins|sample-packs/{id}.md`). */
export function productMarkdownFilePath(
  id: string,
  category: AudioloomProductCategory,
): string {
  const sub = category === "plugin" ? "plugins" : "sample-packs";
  return join(contentDir(), "products", sub, `${id}.md`);
}

/** Legacy / alternate locations checked when moving or detecting an existing PDP. */
export function productMarkdownCandidatePaths(id: string): string[] {
  const root = contentDir();
  return [
    productMarkdownFilePath(id, "plugin"),
    productMarkdownFilePath(id, "sample-pack"),
    join(root, "plugins", `${id}.md`),
    join(root, "product", `${id}.md`),
    join(root, "products", `${id}.md`),
  ];
}
