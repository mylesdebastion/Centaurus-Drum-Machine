/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { wledBridgePlugin } from './vite-plugins/wled-bridge'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wledBridgePlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/hardware/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/hardware/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/hardware/**/*.test.{ts,tsx}',
      ],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
})