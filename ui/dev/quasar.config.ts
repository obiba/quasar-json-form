// Configuration for your app
// https://quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(() => {
  return {
    boot: [
      'register',
      'i18n',
      'prism'
    ],

    css: [
      'app.sass'
    ],

    extras: [
      'roboto-font',
      'material-icons'
    ],

    build: {
      vueRouterMode: 'hash',

      // @jsonforms/vue renderers are authored with the Options API
      vueOptionsAPI: true,

      alias: {
        ui: path.resolve(__dirname, '../src/index.esm.js')
      },

      define: {
        __UI_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
        __QUASAR_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
      },

      vitePlugins: [
        // ['vite-plugin-checker', { vueTsc: false }]
      ]
    },

    devServer: {
      open: false
    },

    framework: {
      config: {},
      plugins: []
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: [
        'render'
      ]
    },

    pwa: {
      workboxMode: 'GenerateSW',
      injectPWAMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false
    },

    capacitor: {
      hideSplashscreen: true
    },

    electron: {
      inspectPort: 5858,

      bundler: 'packager',

      packager: {
      },

      builder: {
        appId: 'dev'
      }
    }
  }
})
