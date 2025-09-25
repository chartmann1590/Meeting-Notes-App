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
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false, // Include original source in source maps
        manualChunks: {
          // Split vendor libraries into separate chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
          'ai-vendor': ['openai', 'zustand'],
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
      "@": path.resolve(__dirname, "./src"),
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