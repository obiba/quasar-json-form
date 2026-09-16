import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  define: {
    __UI_VERSION__: JSON.stringify('test'),
  },
  resolve: {
    alias: [
      // vitest runs under node: force the client build of Quasar (the "node"
      // export condition would select the SSR build)
      { find: /^quasar$/, replacement: fileURLToPath(new URL('./node_modules/quasar/dist/quasar.client.js', import.meta.url)) },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // build entry points, not exercised by the tests
      exclude: ['src/index.common.ts', 'src/index.umd.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
    },
  },
})
