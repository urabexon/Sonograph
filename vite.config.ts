import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Ship updates automatically: the service worker activates the new build
      // on the next load without a manual prompt.
      registerType: "autoUpdate",
      workbox: {
        // Precache the app shell + the WASM module so the tuner works offline.
        globPatterns: ["**/*.{js,css,html,wasm,svg,woff2}"],
      },
      manifest: {
        name: "Sonograph",
        short_name: "Sonograph",
        description:
          "A tuner for matching the pitch of your instrument or voice",
        lang: "en",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
