import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'word-cloud': resolve(__dirname, 'firebase-word-cloud/index.html'),
        'word-cloud-screen': resolve(__dirname, 'firebase-word-cloud/screen.html'),
        'five-levels': resolve(__dirname, 'five-levels/index.html'),
        'ability-quiz': resolve(__dirname, 'interactive-ability-quiz/index.html')
      }
    }
  }
});
