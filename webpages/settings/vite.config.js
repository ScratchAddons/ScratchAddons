import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve("./index.html"),
        popup: resolve("./src/popup/index.html"),
      },
    },
  },

  base: "/webpages/settings/dist/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)).at,
      //'@@': fileURLToPath(new URL('../', import.meta.url)).at,
    },
  },
});
