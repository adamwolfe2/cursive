import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: 'jsdom',
    globals: true,

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Exclusions
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/.next/**',
    ],

    // Include patterns
    include: [
      'tests/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'src/lib/supabase/**', // Exclude Supabase client code (tested via integration)
        'src/lib/inngest/**', // Exclude Inngest functions (tested via integration)
      ],
      // Thresholds (increase over time)
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },

    // Test timeout
    testTimeout: 10000,

    // Pool configuration for better parallelization
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },

    // Watch mode configuration
    watch: false,

    // Reporter configuration
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
