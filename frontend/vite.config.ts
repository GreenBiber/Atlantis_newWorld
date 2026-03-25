import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['all', 'sd_frontend', '187.77.88.215'],
    proxy: {
      '/api': {
        target: 'http://sd_backend:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    allowedHosts: ['game.promptlyapp.cloud', 'localhost'],
    host: '0.0.0.0',
    port: 5173
  }
});