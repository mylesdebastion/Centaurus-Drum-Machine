/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { wledBridgePlugin } from './vite-plugins/wled-bridge'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wledBridgePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces for tablet/mobile access
    port: 5173,
    strictPort: true // Fail if port is busy instead of using next available port
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: [
      'src/hardware/__tests__/**/*.test.{ts,tsx}',
      'src/contexts/__tests__/**/*.test.{ts,tsx}',
      'src/utils/__tests__/**/*.test.{ts,tsx}',
    ],
    coverage: {
      reporter: ['text', 'html'],
      include: [
        'src/hardware/**/*.{ts,tsx}',
        'src/contexts/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/hardware/**/*.test.{ts,tsx}',
        'src/contexts/**/*.test.{ts,tsx}',
        'src/utils/**/*.test.{ts,tsx}',
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