import { defineConfig } from 'vitest/config'

// Pruebas automáticas: se ejecutan con `npm test` y antes de cada publicación.
export default defineConfig({
  define: { __BUILD__: JSON.stringify('test') },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
})
