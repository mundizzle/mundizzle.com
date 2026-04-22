import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import type { Plugin } from "vite-plus";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const buildContentScript = path.resolve(rootDir, "scripts", "build-content.mjs");
const generatedDataFile = path.resolve(rootDir, "src", "generated", "resume-data.ts");
const resumeAliases = new Map([
  ["/mundi-morgado-resume.md", "/resume.md"],
  ["/mundi-morgado-resume.pdf", "/resume.pdf"],
]);
const watchedContentFiles = new Set([
  path.resolve(rootDir, "src", "resume.md"),
  path.resolve(rootDir, "src", "endorsements.md"),
]);

function runContentBuild() {
  execFileSync(process.execPath, [buildContentScript, "dev-assets"], {
    cwd: rootDir,
    stdio: "inherit",
  });
}

function applyResumeAliases(url: string | undefined) {
  if (!url) {
    return url;
  }

  const [pathname, query = ""] = url.split("?");
  const rewritten = resumeAliases.get(pathname);
  if (!rewritten) {
    return url;
  }

  return query ? `${rewritten}?${query}` : rewritten;
}

function resumeDataPlugin(): Plugin {
  return {
    name: "resume-data",
    buildStart() {
      runContentBuild();
    },
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        req.url = applyResumeAliases(req.url);
        next();
      });

      const rebuild = (file: string) => {
        const absoluteFile = path.resolve(file);
        if (!watchedContentFiles.has(absoluteFile)) {
          return;
        }

        try {
          runContentBuild();
          const modules = server.moduleGraph.getModulesByFile(generatedDataFile);
          modules?.forEach((moduleNode) => {
            server.moduleGraph.invalidateModule(moduleNode);
          });
          server.ws.send({ type: "full-reload" });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          server.config.logger.error(message);
        }
      };

      server.watcher.on("add", rebuild);
      server.watcher.on("change", rebuild);
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        req.url = applyResumeAliases(req.url);
        next();
      });
    },
  };
}

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [react(), tailwindcss(), resumeDataPlugin()],
});
