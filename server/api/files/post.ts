import { ensureBlob, blob } from "@nuxthub/blob";
import { eventHandler, readFormData, createError } from "h3";

export default eventHandler(async (event) => {
  const form = await readFormData(event);
  const file = form.get("file") as File;

  if (!file || !file.size) {
    throw createError({ statusCode: 400, message: "No file provided" });
  }

  ensureBlob(file, {
    maxSize: "10MB",
    types: ["image"],
  });

  return blob.put(file.name, file, {
    addRandomSuffix: false,
    prefix: "images",
  });
});
