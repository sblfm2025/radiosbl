import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

const outputFile = resolve("tmp/firestore-seed.json");
const tempModule = resolve("tmp/firestore-seed-builder.mjs");

await mkdir(dirname(tempModule), { recursive: true });

await build({
  configFile: false,
  logLevel: "silent",
  build: {
    lib: {
      entry: "src/data/firestoreSeed.ts",
      formats: ["es"],
      fileName: () => "firestore-seed-builder.mjs"
    },
    outDir: "tmp",
    emptyOutDir: false,
    rollupOptions: {
      external: ["lucide-react", "react", "react-dom"]
    }
  }
});

const { buildFirestoreSeed } = await import(pathToFileURL(tempModule).href);
const seed = buildFirestoreSeed();

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(seed, null, 2)}\n`, "utf8");

console.log(`Wrote ${outputFile}`);
console.log(
  JSON.stringify(
    Object.fromEntries(Object.entries(seed).map(([key, value]) => [key, value.length])),
    null,
    2
  )
);
