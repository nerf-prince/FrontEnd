import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://backend.nerfprince.soare.io/',
        changeOrigin: true,
        secure: false, // Ignore SSL certificate errors for localhost
      }
    }
  }
})
