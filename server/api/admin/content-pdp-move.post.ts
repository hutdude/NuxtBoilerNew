import { existsSync } from "node:fs";
import { mkdir, rename } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";

import type { AudioloomProductCategory } from "../../../types/audioloom-product-metadata";
import {
  productMarkdownCandidatePaths,
  productMarkdownFilePath,
} from "../../utils/product-markdown-paths";

const bodySchema = z.object({
  id: z.string().min(1),
  /** Target category — file is placed under `content/products/plugins` or `content/products/sample-packs`. */
  productCategory: z.enum(["plugin", "sample-pack"]),
});

function assertSafeContentId(id: string) {
  if (id.includes("..") || id.includes("/") || id.includes("\\")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid id",
    });
  }
}

/**
 * Moves an existing product PDP `.md` into the folder for `productCategory`.
 * Checks canonical paths plus legacy `content/plugins`, `content/product`, `content/products/{id}.md`.
 */
export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(event, bodySchema.parse);
  assertSafeContentId(body.id);

  const dest = productMarkdownFilePath(
    body.id,
    body.productCategory as AudioloomProductCategory,
  );

  if (existsSync(dest)) {
    return {
      ok: true as const,
      moved: false as const,
      path: dest.replace(`${process.cwd()}/`, ""),
    };
  }

  const candidates = productMarkdownCandidatePaths(body.id);
  const src = candidates.find(
    (p) => p !== dest && existsSync(p),
  );

  if (!src) {
    return {
      ok: true as const,
      moved: false as const,
      path: null,
    };
  }

  await mkdir(dirname(dest), { recursive: true });
  await rename(src, dest);

  return {
    ok: true as const,
    moved: true as const,
    from: src.replace(`${process.cwd()}/`, ""),
    to: dest.replace(`${process.cwd()}/`, ""),
  };
});
