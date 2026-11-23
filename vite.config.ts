import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { PYODIDE_CACHE } from './src/py/version';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Math Lab',
        short_name: 'Math Lab',
        description: 'Maths, physics and numerical methods for computational science.',
        theme_color: '#1d2826',
        background_color: '#1d2826',
        display: 'standalone',
        start_url: '.',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // Core: app shell, JS, CSS, bundled fonts (incl. KaTeX woff2). Python lives in its own cache.
        globPatterns: ['**/*.{js,css,html,woff2,svg,webmanifest}'],
        globIgnores: ['pyodide/**'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/pyodide/'),
            handler: 'CacheFirst',
            options: { cacheName: PYODIDE_CACHE, cacheableResponse: { statuses: [200] } },
          },
        ],
      },
    }),
  ],
  worker: { format: 'es' },
  build: { target: 'es2022', chunkSizeWarningLimit: 1500 },
});
