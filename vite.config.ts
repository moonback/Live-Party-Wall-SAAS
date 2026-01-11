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
      build: {
        // Optimisation du code splitting
        rollupOptions: {
          output: {
            // Séparer les chunks par type
            manualChunks: (id) => {
              // Vendor chunks séparés pour meilleur cache
              if (id.includes('node_modules')) {
                // React et React DOM ensemble (souvent utilisés ensemble)
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                // Supabase séparé (gros bundle)
                if (id.includes('@supabase')) {
                  return 'supabase-vendor';
                }
                // Google Gemini séparé
                if (id.includes('@google/genai')) {
                  return 'gemini-vendor';
                }
                // Framer Motion séparé (gros bundle)
                if (id.includes('framer-motion')) {
                  return 'framer-vendor';
                }
                // Face-api séparé (gros bundle)
                if (id.includes('face-api')) {
                  return 'face-api-vendor';
                }
                // Autres vendors
                return 'vendor';
              }
              // Chunks par fonctionnalité
              if (id.includes('components/admin')) {
                return 'admin';
              }
              if (id.includes('components/photobooth')) {
                return 'photobooth';
              }
              if (id.includes('components/gallery')) {
                return 'gallery';
              }
              if (id.includes('components/projection')) {
                return 'projection';
              }
              if (id.includes('services')) {
                return 'services';
              }
            },
            // Optimisation des noms de chunks
            chunkFileNames: 'assets/js/[name]-[hash].js',
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          },
        },
        // Augmenter la limite de warning pour les chunks
        chunkSizeWarningLimit: 1000,
        // Source maps pour production (optionnel, peut être désactivé pour réduire la taille)
        sourcemap: mode === 'development',
      },
    };
});
