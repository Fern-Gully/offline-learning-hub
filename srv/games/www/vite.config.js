import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        fire: resolve(__dirname, 'fire/index.html'),
      },
    },
  },
  server: {
    host: true,
    port: 4173
  }
});
