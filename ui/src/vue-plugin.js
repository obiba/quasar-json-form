import Component from './components/Component'
import QDateRenderer from './components/QDateRenderer'
import QTimeRenderer from './components/QTimeRenderer'
import QDateTimeRenderer from './components/QDateTimeRenderer'
import QSelectRenderer from './components/QSelectRenderer'
import QNumberRenderer from './components/QNumberRenderer'
import QRatingRenderer from './components/QRatingRenderer'
import QStringRenderer from './components/QStringRenderer'
import QToggleRenderer from './components/QToggleRenderer'
import QSectionRenderer from './components/QSectionRenderer'
import QLabelRenderer from './components/QLabelRenderer'
import QListRenderer from './components/QListRenderer'
import QJsonForm from './components/QJsonForm'

const version = __UI_VERSION__

function install (app) {
  app.component(Component.name, Component)
  app.component(QDateRenderer.name, QDateRenderer)
  app.component(QTimeRenderer.name, QTimeRenderer)
  app.Component(QDateTimeRenderer.name, QDateTimeRenderer)
  app.component(QSelectRenderer.name, QSelectRenderer)
  app.component(QNumberRenderer.name, QNumberRenderer)
  app.component(QRatingRenderer.name, QRatingRenderer)
  app.component(QStringRenderer.name, QStringRenderer)
  app.component(QToggleRenderer.name, QToggleRenderer)
  app.component(QSectionRenderer.name, QSectionRenderer)
  app.component(QListRenderer.name, QListRenderer)
  app.component(QLabelRenderer.name, QLabelRenderer)
  app.component(QJsonForm.name, QJsonForm)
}

export {
  version,
  Component,
  QDateRenderer,
  QTimeRenderer,
  QDateTimeRenderer,
  QSelectRenderer,
  QNumberRenderer,
  QRatingRenderer,
  QStringRenderer,
  QToggleRenderer,
  QSectionRenderer,
  QListRenderer,
  QLabelRenderer,
  QJsonForm,
  install
}
