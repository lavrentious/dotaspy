import tailwind from "bun-plugin-tailwind";
import { rm } from "node:fs/promises";
import path from "node:path";

const outdir = path.join(process.cwd(), "dist");
await rm(outdir, { recursive: true, force: true });

const entrypoints = [...new Bun.Glob("src/**/*.html").scanSync()];

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [tailwind],
  minify: true,
  target: "browser",
  sourcemap: "linked",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

for (const output of result.outputs) {
  console.log(` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB`);
}

await Bun.$`cp -r public/heroes dist/heroes`;
console.log(` public/heroes → dist/heroes`);
await Bun.$`cp -r public/icons dist/icons`;
console.log(` public/icons  → dist/icons`);

// Build precache URL list: app shell assets + all icons (small enough to precache eagerly).
// Hero images (~68 KB each × 127) are left to lazy caching to avoid a huge install payload.
const shellUrls = result.outputs
  .filter((o) => !o.path.endsWith(".map"))
  .map((o) => "/" + path.relative(outdir, o.path));

const iconUrls = [...new Bun.Glob("*.png").scanSync("public/icons")]
  .map((f) => `/icons/${f}`);

const precacheUrls = ["/", ...shellUrls, ...iconUrls];

await Bun.build({
  entrypoints: ["src/sw.ts"],
  outdir,
  target: "browser",
  minify: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "__PRECACHE_URLS__": JSON.stringify(precacheUrls),
  },
});

console.log(` dist/sw.js  (precaching ${precacheUrls.length} urls)`);
