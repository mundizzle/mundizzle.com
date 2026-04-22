import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { build } from "vite";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const clientOutDir = path.resolve(rootDir, "dist");
const ssrOutDir = path.resolve(rootDir, ".vite-ssr");
const indexHtmlPath = path.resolve(clientOutDir, "index.html");
const ssrEntryPath = path.resolve(rootDir, "src", "entry-server.tsx");

function injectMarkup(html, markup) {
  return html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
}

function stripClientScript(html) {
  return html.replace(/\s*<script type="module" crossorigin src="[^"]+"><\/script>/, "");
}

function findClientScriptPath(html) {
  const match = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
  return match?.[1] ?? null;
}

async function buildServerEntry() {
  await rm(ssrOutDir, { recursive: true, force: true });
  await mkdir(ssrOutDir, { recursive: true });

  await build({
    configFile: path.resolve(rootDir, "vite.config.ts"),
    build: {
      emptyOutDir: false,
      minify: false,
      outDir: ssrOutDir,
      ssr: ssrEntryPath,
      rollupOptions: {
        output: {
          entryFileNames: "entry-server.mjs",
        },
      },
    },
  });
}

async function prerender() {
  await buildServerEntry();

  const serverEntryUrl = pathToFileURL(path.resolve(ssrOutDir, "entry-server.mjs")).href;
  const { render } = await import(serverEntryUrl);
  const renderedMarkup = render();

  const currentHtml = await readFile(indexHtmlPath, "utf8");
  const clientScriptSrc = findClientScriptPath(currentHtml);
  const staticHtml = stripClientScript(injectMarkup(currentHtml, renderedMarkup));

  await writeFile(indexHtmlPath, staticHtml);

  if (clientScriptSrc) {
    const clientScriptPath = path.resolve(clientOutDir, clientScriptSrc.replace(/^\//, ""));
    await unlink(clientScriptPath).catch(() => {});
  }

  await rm(ssrOutDir, { recursive: true, force: true });
}

await prerender();
