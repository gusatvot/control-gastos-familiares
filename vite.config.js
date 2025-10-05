import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  // Esto asegura que las variables con VITE_ estén disponibles en el build
  define: {
    'process.env': {}
  }
})