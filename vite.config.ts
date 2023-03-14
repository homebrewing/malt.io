import { defineConfig, type PluginOption } from "vite";
import solidPlugin from "vite-plugin-solid";
import { visualizer } from "rollup-plugin-visualizer";
import preload from "vite-plugin-preload";

export default defineConfig({
  plugins: [
    solidPlugin(),
    preload(),
    visualizer({ gzipSize: true }) as PluginOption,
  ],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});
