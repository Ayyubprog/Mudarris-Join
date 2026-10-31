import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const functionSource = await readFile(resolve(root, "functions/[[path]].js"), "utf8");
const entry = `

export default {
  async fetch(request, env, ctx) {
    return onRequest({
      request,
      env,
      params: {},
      data: {},
      waitUntil: (promise) => ctx.waitUntil(promise),
      next: () => env.ASSETS.fetch(request)
    });
  }
};
`;
await writeFile(resolve(root, "public/_worker.js"), functionSource + entry, "utf8");
console.log("Built public/_worker.js from functions/[[path]].js");
