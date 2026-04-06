import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

function versionPlugin(): Plugin {
  const buildId = Date.now().toString(36);
  const silent = process.env.SILENT_DEPLOY === "1";
  return {
    name: "version-plugin",
    config() {
      return { define: { __BUILD_ID__: JSON.stringify(buildId) } };
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ buildId, silent }),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), versionPlugin()],
  test: {
    environment: "node",
  },
});
