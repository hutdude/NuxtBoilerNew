import { queryContentFirstByStem } from "~/composables/useContentFirst";

/** Stems tried when detecting an existing product PDP (canonical + legacy). */
export function productPdpStemsToProbe(id: string): string[] {
  return [
    `products/plugins/${id}`,
    `products/sample-packs/${id}`,
    `plugins/${id}`,
    `product/${id}`,
    `products/${id}`,
  ];
}

export async function queryProductPdpDoc(id: string) {
  for (const stem of productPdpStemsToProbe(id)) {
    const doc = await queryContentFirstByStem(stem);
    if (doc) {
      return doc;
    }
  }
  return null;
}
