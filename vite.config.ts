import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:demo` genera un único HTML autocontenido para probar la app sin servidor.
export default defineConfig(({ mode }) => ({
  // Rutas relativas para que funcione en GitHub Pages (/pizarra-tactica/) y en cualquier carpeta.
  base: './',
  plugins: mode === 'demo' ? [react(), viteSingleFile()] : [react()],
  build: mode === 'demo' ? { outDir: 'dist-demo' } : {},
}))
