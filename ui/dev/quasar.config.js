import { configure } from 'quasar/wrappers'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default configure((/* ctx */) => {
  return {
    boot: [
      'register'
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

      vitePlugins: [
        ['vite-plugin-checker', { vueTsc: false }]
      ],

      extendViteConf (viteConf) {
        viteConf.resolve.alias.ui = path.resolve(__dirname, '../src/index.esm.js')
        
        // Add define to fix __UI_VERSION__ error
        viteConf.define = {
          ...viteConf.define,
          __UI_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
          __QUASAR_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
        }
      }
    },

    devServer: {
      open: true
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
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
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
