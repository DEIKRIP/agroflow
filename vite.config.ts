import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Fix for CJS build deprecation warning
process.env.VITE_CJS_IGNORE_WARNING = 'true';

export default defineConfig({
  plugins: [
    react({
      // Add this to fix useLayoutEffect warning in SSR
      jsxRuntime: 'automatic',
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }), 
    tsconfigPaths(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'esnext',
    minify: 'terser',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            return 'vendor-other';
          }
        },
      },
    },
  },
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
