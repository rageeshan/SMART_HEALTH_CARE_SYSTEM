import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // auth-service  → 5001
      "/api/auth": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      // patient-service → 5002
      "/api/patients": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
      // appointment-service → 5003
      "/api/appointments": {
        target: "http://localhost:5003",
        changeOrigin: true,
      },
      // doctor-service → 5004
      "/api/doctors": {
        target: "http://localhost:5004",
        changeOrigin: true,
      },
      // notification-service → 5005
      "/api/notifications": {
        target: "http://localhost:5005",
        changeOrigin: true,
      },
      // telemedicine-service → 5006
      "/api/sessions": {
        target: "http://localhost:5006",
        changeOrigin: true,
      },
      // ai-symptom-service → 5007
      "/api/symptoms": {
        target: "http://localhost:5007",
        changeOrigin: true,
      },
      // payment-service → 5008
      "/api/payments": {
        target: "http://localhost:5008",
        changeOrigin: true,
      },
    },
  },
});
