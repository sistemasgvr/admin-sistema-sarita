import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

/** Pruebas unitarias de utilidades puras (sin DOM); las de interfaz siguen en Playwright. */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
})
