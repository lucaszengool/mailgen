import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'esbuild', // Use esbuild instead of terser for better module handling
    target: 'es2020',  // Set explicit target to prevent over-aggressive optimization
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
        // Prevent aggressive variable mangling that causes TDZ errors
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3333',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: process.env.PORT || 8080,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3333',
        changeOrigin: true,
        secure: false
      }
    },
    allowedHosts: [
      'mailgen-production.up.railway.app',
      '.railway.app',
      'localhost'
    ]
  }
})