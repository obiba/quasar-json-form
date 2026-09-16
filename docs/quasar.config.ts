// Configuration of the documentation site
// https://quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import anchor from 'markdown-it-anchor'
import type { Options as MarkdownOptions } from 'unplugin-vue-markdown/types'
import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

loadLanguages(['json', 'bash', 'javascript', 'typescript', 'markup'])

const markdownOptions: MarkdownOptions = {
  headEnabled: false,
  wrapperClasses: 'doc-page',
  markdownItOptions: {
    html: true,
    linkify: true,
    highlight (code: string, lang: string) {
      const grammar = Prism.languages[lang]
      const html = grammar ? Prism.highlight(code, grammar, lang) : code.replace(/</g, '&lt;')
      return `<pre class="language-${lang}"><code class="language-${lang}">${html}</code></pre>`
    }
  },
  markdownItSetup (md) {
    md.use(anchor, { permalink: anchor.permalink.headerLink() })
  }
}

const uiVersion: string = JSON.parse(readFileSync(path.resolve(__dirname, '../ui/package.json'), 'utf-8')).version

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

      // served from https://www.obiba.org/quasar-json-form/ by the docs workflow
      publicPath: process.env.DOCS_PUBLIC_PATH || '/',

      // @jsonforms/vue renderers are authored with the Options API
      vueOptionsAPI: true,

      alias: {
        ui: path.resolve(__dirname, '../ui/src/index.esm.ts'),
        // the JSON Forms packages of the library, for the custom renderers of the examples
        '@jsonforms/core': path.resolve(__dirname, '../ui/node_modules/@jsonforms/core'),
        '@jsonforms/vue': path.resolve(__dirname, '../ui/node_modules/@jsonforms/vue')
      },

      // The library sources are consumed from ../ui/src, whose imports would otherwise
      // resolve to ../ui/node_modules copies of vue/quasar/vue-i18n: use this app's copies
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
            'vue-i18n': [path.resolve(__dirname, 'node_modules/vue-i18n')],
            '@jsonforms/core': [path.resolve(__dirname, '../ui/node_modules/@jsonforms/core')],
            '@jsonforms/vue': [path.resolve(__dirname, '../ui/node_modules/@jsonforms/vue')]
          }
        }
      },

      define: {
        __UI_VERSION__: JSON.stringify(uiVersion)
      },

      // pages are written in Markdown
      viteVuePluginOptions: {
        include: [/\.vue$/, /\.md$/]
      },

      vitePlugins: [
        ['unplugin-vue-markdown/vite', markdownOptions]
      ]
    },

    devServer: {
      open: false
    },

    framework: {
      config: {},
      plugins: ['Notify', 'Dark']
    },

    animations: []
  }
})
