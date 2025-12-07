import Component from './components/Component'
import QDateRenderer from './components/QDateRenderer'
import QEnumRenderer from './components/QEnumRenderer'
import QNumberRenderer from './components/QNumberRenderer'
import QStringRenderer from './components/QStringRenderer'
import QToggleRenderer from './components/QToggleRenderer'
import QJsonForm from './components/QJsonForm'

const version = __UI_VERSION__

function install (app) {
  app.component(Component.name, Component)
  app.component(QDateRenderer.name, QDateRenderer)
  app.component(QEnumRenderer.name, QEnumRenderer)
  app.component(QNumberRenderer.name, QNumberRenderer)
  app.component(QStringRenderer.name, QStringRenderer)
  app.component(QToggleRenderer.name, QToggleRenderer)
  app.component(QJsonForm.name, QJsonForm)
}

export {
  version,
  Component,
  QDateRenderer,
  QEnumRenderer,
  QNumberRenderer,
  QStringRenderer,
  QToggleRenderer,
  QJsonForm,
  install
}
