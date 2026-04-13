import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";

function versionPlugin(): Plugin {
  const buildId = Date.now().toString(36);
  return {
    name: "version-plugin",
    config() {
      return { define: { __BUILD_ID__: JSON.stringify(buildId) } };
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ buildId }),
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    versionPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      workbox: {
        // New SWs activate immediately instead of waiting for all tabs to close.
        // This ensures update-banner taps always work — without it, the waiting
        // SW needs a SKIP_WAITING message from the client, which creates a
        // deadlock when the old client code doesn't send it.
        skipWaiting: true,
        clientsClaim: true,
        // Precache the app shell — JS, CSS, HTML, fonts, banners.
        // Game icons (~10 MB) are runtime-cached on first use instead.
        globPatterns: ["**/*.{js,css,html,woff2,webp}"],
        runtimeCaching: [
          {
            urlPattern: /\/icons\/.+\.png$/,
            handler: "CacheFirst",
            options: {
              cacheName: "game-icons",
              expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
        // Don't precache PWA icons either (they're in public/ root)
        globIgnores: ["**/icons/**"],
      },
      manifest: {
        name: "SeaBound",
        short_name: "SeaBound",
        description:
          "Tropical island castaway survival idle game — craft, gather, explore.",
        theme_color: "#0c1a1a",
        background_color: "#0c1a1a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
    }),
  ],
  test: {
    environment: "node",
  },
});
