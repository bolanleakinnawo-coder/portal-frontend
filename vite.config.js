import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'https://portal-backend-pqub.onrender.com';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // During `npm run dev`, requests to /api go through Vite to the backend.
    // The browser only talks to localhost, so the backend's CORS settings don't matter in development.
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true, secure: true },
    },
  },
});
