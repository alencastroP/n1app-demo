// demo/vite.config.js
// Réplica visual do N1 App — 100% offline.
// Sem proxy para o backend: toda a rede é interceptada por src/mock/mockFetch.js.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    open: true,
  },
});
