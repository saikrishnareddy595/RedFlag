// Copies the pdf.js worker into /public so it can be served as a static asset.
// Keeping the worker out of the webpack/Terser pipeline avoids ESM bundling
// errors and ensures the worker version always matches the installed package.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const src = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = resolve(__dirname, "..", "public");
const dest = resolve(destDir, "pdf.worker.min.mjs");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);

console.log("✓ Copied pdf.js worker to public/pdf.worker.min.mjs");
