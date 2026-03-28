import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/webpages-dist/",
  plugins: [vue()],
  build: {
    outDir: "../webpages-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        settings: resolve("./settings.html"),
        popup: resolve("./popup.html"),
        licenses: resolve("./licenses.html"),
        permissions: resolve("./permissions.html"),
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
});
