import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

const packageVersion = (JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string }).version;

export default defineConfig({
  // Shown only in Settings → About this app; learner-facing copy carries no version.
  define: { __APP_VERSION__: JSON.stringify(packageVersion) },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Guitar Academy",
        short_name: "Guitar Academy",
        description: "A relationship-first path from hearing and playing to original music.",
        theme_color: "#15241f",
        background_color: "#f3f1ea",
        display: "standalone",
        id: "/",
        orientation: "any",
        scope: "/",
        start_url: "/today",
        categories: ["education", "music"],
        icons: [
          { src: "/guitar-academy-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/guitar-academy-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/guitar-academy-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "/guitar-academy-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/__\//],
        // Only the app's code, fonts, notices and install icons belong to the
        // automatic offline shell. Put future lesson demonstrations under
        // lesson-media/ and fetch them deliberately for a selected lesson;
        // a broad **/* pattern would download every new media file on install.
        // Account chunks stay here: a signed-in device must still open its
        // local workspace after an offline update.
        globPatterns: [
          "index.html",
          "registerSW.js",
          "assets/*.{js,css,woff2}",
          "fonts/*-OFL.txt"
        ],
        cleanupOutdatedCaches: true,
        /*
         * A new worker installs and then WAITS. clientsClaim and skipWaiting
         * together handed control to a new build the moment it arrived, and
         * install.ts reloaded on controllerchange — so an update could land
         * mid-recording, mid-import, or on top of unsaved edits, with no warning
         * and nothing to decline. The app now decides when it is safe to apply,
         * and tells the worker through a SKIP_WAITING message.
         */
        clientsClaim: false,
        skipWaiting: false
      }
    })
  ],
  server: {
    port: 4184
  },
  build: {
    manifest: true,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/firebase/") || id.includes("/node_modules/@firebase/")) return "firebase";
        }
      }
    }
  }
});
