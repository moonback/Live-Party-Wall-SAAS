import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isElectron = process.env.ELECTRON === 'true';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        // Plugin Electron uniquement si on lance en mode Electron
        ...(isElectron ? [
          electron([
            {
              // Main process
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron/main',
                  rollupOptions: {
                    external: ['electron'],
                  },
                },
              },
            },
            {
              // Preload script
              entry: 'electron/preload.ts',
              onstart(options) {
                // Notify the renderer process to reload the page when the preload scripts build is complete
                options.reload();
              },
              vite: {
                build: {
                  outDir: 'dist-electron/preload',
                  rollupOptions: {
                    external: ['electron'],
                  },
                },
              },
            },
          ]),
        ] : []),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      base: './', // Important pour Electron : chemins relatifs
      worker: {
        format: 'es', // Format ES modules pour les workers
      },
    };
});
