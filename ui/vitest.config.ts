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
  },
})
