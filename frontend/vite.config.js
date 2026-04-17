import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/auth": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/api/patients": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
      "/api/doctors": {
        target: "http://localhost:5003",
        changeOrigin: true,
      },
      "/api/appointments": {
        target: "http://localhost:5004",
        changeOrigin: true,
      },
      "/api/sessions": {
        target: "http://localhost:5006",
        changeOrigin: true,
      },
    },
  },
});
