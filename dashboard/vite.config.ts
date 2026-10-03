// DEV C — Phase 5
// Vite config. The proxy entry forwards /api/* to the FastAPI backend so you
// don't need CORS headers during local dev.
//
// TODO: Confirm the backend port (default 8000) matches what Dev A is running.
//       Change target if needed, but do not commit a hardcoded prod URL here.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
