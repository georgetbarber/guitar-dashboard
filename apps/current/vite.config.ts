import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";

const packageVersion = (JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string }).version;

/*
 * LESSON PACKS. Lesson players, the music engine and each stage's authored
 * lessons are reached only through dynamic imports, so the bundler already
 * splits them from the shell. Their files are named assets/lesson-*, kept out
 * of the automatic offline shell and saved per stage instead
 * (src/v8/lessonPacks.ts). check-offline-shell.mjs fails the build if the
 * shell imports a lesson file directly or a pack is incomplete.
 */
const LESSON_MODULES = [
  /\/src\/core\/score\//,
  /\/src\/core\/music\/chordSymbols\.ts$/,
  /\/src\/audio\/(?:scorePlayer|pluck)\.ts$/,
  /\/src\/v8\/components\/score\//,
  /\/src\/v8\/components\/(?:LessonPlayer|PilotEpisodePlayer|PiecePlayer)\.tsx$/,
  /\/src\/v8\/pieces\/(?:library|validate)\.ts$/,
  /\/src\/v8\/lessons\/validate\.ts$/,
  // The score views' styles travel with them.
  /\/src\/styles\/score\.css$/,
  /\/src\/v8\/lessonProgress\.ts$/,
  /\/src\/v8\/lessons\/(?:stage\d+|load)\.ts$/,
];
const isLessonModule = (id: string) => LESSON_MODULES.some((pattern) => pattern.test(id));
/** A chunk is part of a lesson pack when it is a lesson entry or holds nothing but lesson modules. */
const isLessonChunk = (chunk: { facadeModuleId?: string | null; moduleIds: readonly string[] }) =>
  (typeof chunk.facadeModuleId === "string" && isLessonModule(chunk.facadeModuleId)) ||
  (chunk.moduleIds.length > 0 && chunk.moduleIds.every(isLessonModule));

/** Writes lesson-packs.json: for each stage, every lesson-* file its lessons need. */
function lessonPacks(): Plugin {
  return {
    name: "interval-lesson-packs",
    apply: "build",
    generateBundle(_options, bundle) {
      const closure = (fileName: string, into: Set<string>) => {
        if (into.has(fileName)) return;
        into.add(fileName);
        const output = bundle[fileName];
        if (output?.type !== "chunk") return;
        for (const imported of output.imports) closure(imported, into);
        for (const css of (output as { viteMetadata?: { importedCss?: Set<string> } }).viteMetadata?.importedCss ?? []) into.add(css);
      };
      const chunks = Object.values(bundle).flatMap((output) => (output.type === "chunk" ? [output] : []));
      const from = (pattern: RegExp) => {
        const files = new Set<string>();
        for (const chunk of chunks) if (chunk.facadeModuleId && pattern.test(chunk.facadeModuleId)) closure(chunk.fileName, files);
        return files;
      };
      // Every stage's pack holds both players: pieces recur across stages.
      const engine = from(/\/src\/v8\/components\/(?:LessonPlayer|PiecePlayer)\.tsx$/);
      const pilot = from(/\/src\/v8\/components\/PilotEpisodePlayer\.tsx$/);
      const stages: Record<string, string[]> = {};
      for (const chunk of chunks) {
        const stage = chunk.facadeModuleId?.match(/\/src\/v8\/lessons\/stage(\d+)\.ts$/)?.[1];
        if (!stage) continue;
        const files = new Set<string>(engine);
        closure(chunk.fileName, files);
        if (stage === "1") for (const file of pilot) files.add(file);
        stages[stage] = [...files].filter((file) => file.startsWith("assets/lesson-")).sort();
      }
      this.emitFile({ type: "asset", fileName: "lesson-packs.json", source: JSON.stringify({ version: 1, stages }, null, 2) });
    },
  };
}

export default defineConfig({
  // Shown only in Settings → About this app; learner-facing copy carries no version.
  define: { __APP_VERSION__: JSON.stringify(packageVersion) },
  plugins: [
    react(),
    lessonPacks(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Interval",
        short_name: "Interval",
        description: "A relationship-first path from hearing and playing to original music.",
        theme_color: "#f2eee8",
        background_color: "#f2eee8",
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
          "lesson-packs.json",
          "assets/*.{js,css,woff2}",
          "fonts/*-OFL.txt"
        ],
        // Lesson packs are saved per stage, not with the shell (src/v8/lessonPacks.ts).
        globIgnores: ["assets/lesson-*"],
        runtimeCaching: [
          {
            // Serve saved lesson files offline; a lesson opened online is saved as it loads.
            urlPattern: /\/assets\/lesson-[^/]+\.(?:js|css)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "interval-lessons",
              cacheableResponse: { statuses: [200] },
              // Saved files are content-hashed. A host that answers "Vary: Origin" would
              // otherwise never match a module import (which sends Origin) against a
              // file saved by fetch (which does not), and the lesson would not open offline.
              matchOptions: { ignoreVary: true }
            }
          }
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
        },
        chunkFileNames: (chunk) => (isLessonChunk(chunk) ? "assets/lesson-[name]-[hash].js" : "assets/[name]-[hash].js"),
        // A lesson player's styles are named after it, so they travel in its pack.
        assetFileNames: (asset) =>
          (asset.names ?? []).some((name) => /^(?:LessonPlayer|PilotEpisodePlayer|PiecePlayer|ScoreView)\.css$/.test(name))
            ? "assets/lesson-[name]-[hash][extname]"
            : "assets/[name]-[hash][extname]"
      }
    }
  }
});
