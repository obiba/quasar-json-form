/**
 * Quasar App Extension index/runner script
 * (runs on each dev/build)
 *
 * Docs: https://quasar.dev/app-extensions/development-guide/index-api
 */

import { defineIndexScript } from '#q-app'

function extendConf (conf) {
  // register our boot file
  conf.boot.push('~@obiba/quasar-app-extension-json-form/src/boot/register.js')

  // make sure the stylesheet goes through the bundler to avoid SSR issues
  conf.css.push('~@obiba/quasar-ui-json-form/src/index.sass')
}

export default defineIndexScript(api => {
  // Quasar compatibility check; you may need
  // hard dependencies, as in a minimum version of the "quasar"
  // package or a minimum version of "@quasar/app-*" CLI
  api.compatibleWith('quasar', '^2.0.0')
  api.compatibleWith('@quasar/app-vite', '^3.0.0')

  // Uncomment the line below if you provide a JSON API for your component
  // api.registerDescribeApi('QJsonForm', '~@obiba/quasar-ui-json-form/src/components/QJsonForm.json')

  // We extend /quasar.config
  api.extendQuasarConf(extendConf)
})
