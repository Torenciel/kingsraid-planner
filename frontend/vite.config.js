import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: '**/*.{js,jsx}', // Include .js and .jsx files
    })
  ],
  server: {
    port: 3000,
    host: true,
    open: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true
      },
      '/kingsraid-data': {
        target: 'http://localhost:3002',
        changeOrigin: true
      }
    }
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
  },
})