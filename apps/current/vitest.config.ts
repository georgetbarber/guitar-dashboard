import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(viteConfig, defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Report the actual trust boundaries, including uncovered code. No
      // global percentage target that can be raised by testing easy helpers.
      include: [
        "src/v8/{store,repository,sync,saveState,updates,cloud}.{ts,tsx}",
        "src/v8/components/{SaveStatus,UpdateNotice,SettingsPanel}.tsx",
        "src/v8/features/Create.tsx",
      ],
    },
  },
}));
