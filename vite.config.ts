import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      buffer: "buffer/",
    },
  },
  define: {
    global: "globalThis",
  },
  plugins: [
    nodePolyfills({
      include: ["buffer", "process"],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
    devtools({
      injectSource: {
        enabled: true,
        ignore: {
          components: ["FullCalendar"],
        },
      },
    }),
    tailwindcss(),
    tanstackStart(),
    nitro(),
    viteReact(),
  ],
});

export default config;
