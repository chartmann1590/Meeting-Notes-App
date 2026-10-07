import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: true,
    sourcemap: 'inline', // Use inline source maps for better error reporting
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    // Vite 8 bundles with Rolldown: the object form of manualChunks is gone,
    // so the same vendor split is expressed as codeSplitting groups.
    rolldownOptions: {
      output: {
        sourcemapExcludeSources: false, // Include original source in source maps
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router-dom|react-router|scheduler)[\\/]/ },
            { name: 'ui-vendor', test: /node_modules[\\/]@radix-ui[\\/]react-(dialog|dropdown-menu|tabs)[\\/]/ },
            { name: 'utils-vendor', test: /node_modules[\\/](date-fns|clsx|tailwind-merge)[\\/]/ },
            { name: 'ai-vendor', test: /node_modules[\\/](openai|zustand)[\\/]/ },
          ],
        },
      },
    },
  },

  // Enable source maps in development too
  css: {
    devSourcemap: true,
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  optimizeDeps: {
    // This is still crucial for reducing the time from when `bun run dev`
    // is executed to when the server is actually ready.
    include: ['react', 'react-dom', 'react-router-dom'],
    force: true,
  },
  define: {
    // Define Node.js globals for the agents package
    global: 'globalThis',
  },
  // Clear cache more aggressively
  cacheDir: 'node_modules/.vite'
})