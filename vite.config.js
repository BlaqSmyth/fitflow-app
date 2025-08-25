import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/home/runner/workspace/client/src",
      "@shared": "/home/runner/workspace/shared",
      "@assets": "/home/runner/workspace/attached_assets",
    },
  },
  root: "/home/runner/workspace/client",
  build: {
    outDir: "/home/runner/workspace/dist/public",
    emptyOutDir: true,
  },
});