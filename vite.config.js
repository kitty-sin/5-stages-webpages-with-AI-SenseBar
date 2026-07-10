import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        screen: resolve(__dirname, 'screen.html'),
        levels: resolve(__dirname, 'levels.html'),
        quiz: resolve(__dirname, 'lv2-google-sheets/index.html')
      }
    }
  }
});
