import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    chunkSizeWarningLimit: 10000,
    target: 'esnext',
    minify: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})


