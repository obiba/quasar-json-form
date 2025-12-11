import Component from './components/Component'
import QDateRenderer from './components/QDateRenderer'
import QSelectRenderer from './components/QSelectRenderer'
import QNumberRenderer from './components/QNumberRenderer'
import QRatingRenderer from './components/QRatingRenderer'
import QStringRenderer from './components/QStringRenderer'
import QToggleRenderer from './components/QToggleRenderer'
import QListRenderer from './components/QListRenderer'
import QJsonForm from './components/QJsonForm'

const version = __UI_VERSION__

function install (app) {
  app.component(Component.name, Component)
  app.component(QDateRenderer.name, QDateRenderer)
  app.component(QSelectRenderer.name, QSelectRenderer)
  app.component(QNumberRenderer.name, QNumberRenderer)
  app.component(QRatingRenderer.name, QRatingRenderer)
  app.component(QStringRenderer.name, QStringRenderer)
  app.component(QToggleRenderer.name, QToggleRenderer)
  app.component(QListRenderer.name, QListRenderer)
  app.component(QJsonForm.name, QJsonForm)
}

export {
  version,
  Component,
  QDateRenderer,
  QSelectRenderer,
  QNumberRenderer,
  QRatingRenderer,
  QStringRenderer,
  QToggleRenderer,
  QListRenderer,
  QJsonForm,
  install
}
