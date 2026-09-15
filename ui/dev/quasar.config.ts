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
        ui: path.resolve(__dirname, '../src/index.esm.ts')
      },

      // The library sources are consumed from ../src, whose imports would otherwise
      // resolve to ../node_modules copies of vue/quasar/vue-i18n: use this app's copies
      // both at bundle time and for the TypeScript program (vue types are nominal).
      extendViteConf (viteConf) {
        viteConf.resolve = viteConf.resolve || {}
        viteConf.resolve.dedupe = [...(viteConf.resolve.dedupe || []), 'vue', 'quasar', 'vue-i18n']
      },

      typescript: {
        extendTsConfig (tsConfig) {
          tsConfig.compilerOptions = tsConfig.compilerOptions || {}
          tsConfig.compilerOptions.paths = {
            ...(tsConfig.compilerOptions.paths || {}),
            vue: [path.resolve(__dirname, 'node_modules/vue')],
            quasar: [path.resolve(__dirname, 'node_modules/quasar')],
            'vue-i18n': [path.resolve(__dirname, 'node_modules/vue-i18n')]
          }
        }
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
