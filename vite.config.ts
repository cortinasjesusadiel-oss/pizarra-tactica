import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `npm run build:demo` genera un único HTML autocontenido para probar la app sin servidor.
export default defineConfig(({ mode }) => ({
  // Rutas relativas para que funcione en GitHub Pages (/pizarra-tactica/) y en cualquier carpeta.
  base: './',
  // Fecha de la versión, visible en la app para saber si ya se actualizó.
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
  plugins: mode === 'demo' || mode === 'mia' ? [react(), viteSingleFile()] : [react()],
  // `mia`: la pizarra personal del dueño en un único archivo, con lo Pro encendido (vite build --mode mia).
  build: mode === 'demo' ? { outDir: 'dist-demo' } : mode === 'mia' ? { outDir: 'dist-mia' } : {},
}))
