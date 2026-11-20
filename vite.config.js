import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const BUILD = '20261120b'
export default defineConfig({
  plugins: [react()],
  server: { host: true, allowedHosts: true, port: 5173 },
  build: {
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/index-[hash]-${BUILD}.js`,
        chunkFileNames: `assets/[name]-[hash]-${BUILD}.js`,
        assetFileNames: `assets/[name]-[hash]-${BUILD}.[ext]`,
      },
    },
  },
})