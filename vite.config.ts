import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-engine': ['pdf-lib'],
          'exifr-engine': ['exifr'],
          'vendor': ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'jszip']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
