import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig(() => {
  return {
    server: {
      watch: {
        usePolling: true,
        interval: 100,
      },
    },

    build: {
      emptyOutDir: true,
      outDir: 'build',
    },

    plugins: [
      react(),
      crx({ manifest }),
      {
        name: 'reload-on-change',
        handleHotUpdate({ file, server }) {
          if (
            file.endsWith('.ts') ||
            file.endsWith('.tsx') ||
            file.endsWith('.js') ||
            file.endsWith('.jsx')
          ) {
            server.restart();
            return [];
          }
        },
      },
    ],

    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
  };
});
