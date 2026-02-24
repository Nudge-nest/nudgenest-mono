import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: {},
  },
  resolve: {
    alias: {
      // Force all packages to use the same React instance
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.SENTRY_AUTH_TOKEN ? [sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT_REVIEW_UI,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: process.env.COMMIT_SHA || 'unknown' },
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    })] : []),
    // Bundle size visualiser — only when ANALYZE=true (run: pnpm build:analyze)
    ...(process.env.ANALYZE === 'true' ? [visualizer({
      open: true,
      filename: 'dist/bundle-report.html',
      gzipSize: true,
      brotliSize: true,
    })] : []),
  ],
  build: {
    sourcemap: true,
  },
  preview: {
    port: 3001,
    strictPort: true,
  },
  server: {
    port: 3001,
    strictPort: true,
    host: true,
    origin: "0.0.0.0:3001",
  },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        css: true,
        // Exclude Playwright spec files — they use a different test runner
        exclude: ['**/node_modules/**', '**/*.spec.ts', '**/*.spec.tsx', 'tests-examples/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/setupTests.ts',
                'tests-examples/',
                'src/__tests__/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData/*',
                'src/main.tsx',
            ],
        },
    },
})
