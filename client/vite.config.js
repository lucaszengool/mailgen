import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    minify: false, // Disable minification to prevent TDZ errors
    target: 'es2020',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`,
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