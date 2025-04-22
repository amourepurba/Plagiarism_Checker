// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/check-text': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/check-file': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/check-url': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
