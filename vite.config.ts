import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          // Express API (server.ts) listens on 3000 by default.
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Core React runtime -- loaded immediately
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            // Firebase -- loaded immediately (auth required on startup)
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase';
            }
            // Icons
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            // pdfjs ~470KB -- isolated so it only loads when a PDF song is opened
            if (id.includes('node_modules/pdfjs-dist')) {
              return 'vendor-pdfjs';
            }
            // Song data 1.4MB -- lazy-loaded by SongLibraryWidget on demand
            if (id.includes('src/data/jebathotta-jeyageethangal')) {
              return 'song-data';
            }
            // Other mock/demo data
            if (id.includes('src/data/mockData') || id.includes('src/data/saints')) {
              return 'demo-data';
            }
          },
        },
      },
    },
  };
});
