import { defineConfig, type PluginOption } from "vite";
import solidPlugin from "vite-plugin-solid";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [solidPlugin(), visualizer({ gzipSize: true }) as PluginOption],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});
