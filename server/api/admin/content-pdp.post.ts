import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { z } from "zod";

import type { AudioloomProductCategory } from "../../../types/audioloom-product-metadata";
import { productMarkdownFilePath } from "../../utils/product-markdown-paths";

const bodySchema = z
  .object({
    kind: z.enum(["product", "bundle"]),
    id: z.string().min(1),
    productCategory: z.enum(["plugin", "sample-pack"]).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => data.kind === "bundle" || data.productCategory !== undefined,
    { message: "productCategory is required when kind is product" },
  );

function assertSafeContentId(id: string) {
  if (id.includes("..") || id.includes("/") || id.includes("\\")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid id",
    });
  }
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(event, bodySchema.parse);
  assertSafeContentId(body.id);

  let filePath: string;
  let relativePath: string;

  if (body.kind === "bundle") {
    const dir = join(process.cwd(), "content", "bundle");
    filePath = join(dir, `${body.id}.md`);
    relativePath = `content/bundle/${body.id}.md`;
  } else {
    const cat = body.productCategory as AudioloomProductCategory;
    filePath = productMarkdownFilePath(body.id, cat);
    const sub = cat === "plugin" ? "plugins" : "sample-packs";
    relativePath = `content/products/${sub}/${body.id}.md`;
  }

  if (existsSync(filePath)) {
    throw createError({
      statusCode: 409,
      statusMessage: "PDP markdown already exists",
    });
  }

  const title = (body.title?.trim() || body.id);
  const desc = (body.description?.trim() || "");

  const markdown = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(desc)}
---

## Overview

`;

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, markdown, "utf8");

  return {
    ok: true,
    path: relativePath,
  };
});
