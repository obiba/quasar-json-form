import type { App } from 'vue'
import QStringRenderer from './components/QStringRenderer.vue'
import QNumberRenderer from './components/QNumberRenderer.vue'
import QToggleRenderer from './components/QToggleRenderer.vue'
import QEnumRenderer from './components/QEnumRenderer.vue'
import QDateRenderer from './components/QDateRenderer.vue'
import QJsonForm from './components/QJsonForm.vue'

const version = __UI_VERSION__

function install(app: App): void {
  app.component(QStringRenderer.name || 'QStringRenderer', QStringRenderer)
  app.component(QNumberRenderer.name || 'QNumberRenderer', QNumberRenderer)
  app.component(QToggleRenderer.name || 'QToggleRenderer', QToggleRenderer)
  app.component(QEnumRenderer.name || 'QEnumRenderer', QEnumRenderer)
  app.component(QDateRenderer.name || 'QDateRenderer', QDateRenderer)
  app.component(QJsonForm.name || 'QJsonForm', QJsonForm)
}

export {
  version,
  QStringRenderer,
  QNumberRenderer,
  QToggleRenderer,
  QEnumRenderer,
  QDateRenderer,
  QJsonForm,
  install
}