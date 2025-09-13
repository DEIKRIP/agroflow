import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(),
  ],
  server: {
    host: true,
    port: 3000,
    open: false,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: [
      {
        find: '@',
        // Use ESM-safe resolution instead of __dirname
        replacement: fileURLToPath(new URL('./src', import.meta.url))
      },
      {
        find: 'leaflet.css',
        replacement: fileURLToPath(new URL('./node_modules/leaflet/dist/leaflet.css', import.meta.url))
      }
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "leaflet/dist/leaflet.css";`
      }
    }
  }
});
