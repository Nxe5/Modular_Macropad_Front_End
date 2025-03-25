import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: resolve("./src/lib"),
    },
  },
  build: {
    // Ensure smaller bundle size for ESP32 storage constraints
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Emit smaller assets by using more aggressive optimization
    cssMinify: true,
    // Configure asset optimization
    rollupOptions: {
      output: {
        manualChunks: undefined, // Keep everything in fewer files
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  // Set base path for ESP32 web server
  base: '/'
})
