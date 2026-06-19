import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // Silence the 500 kB default warning — our combined vendor chunks are intentionally larger
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into separate cacheable chunks
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["recharts"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
