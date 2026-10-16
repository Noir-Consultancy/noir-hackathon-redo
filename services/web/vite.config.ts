import { defineConfig } from "vite";

// In dev, /api is proxied to the api service. In compose, nginx does the same.
const apiUrl = process.env.API_URL ?? "http://localhost:8001";

export default defineConfig({
  server: {
    port: 8000,
    proxy: {
      "/api": {
        target: apiUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
