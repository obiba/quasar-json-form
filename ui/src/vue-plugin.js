import QDateRenderer from './components/QDateRenderer'
import QTimeRenderer from './components/QTimeRenderer'
import QDateTimeRenderer from './components/QDateTimeRenderer'
import QSelectRenderer from './components/QSelectRenderer'
import QOptionsRenderer from './components/QOptionsRenderer'
import QNumberRenderer from './components/QNumberRenderer'
import QRatingRenderer from './components/QRatingRenderer'
import QSliderRenderer from './components/QSliderRenderer'
import QStringRenderer from './components/QStringRenderer'
import QToggleRenderer from './components/QToggleRenderer'
import QSectionRenderer from './components/QSectionRenderer'
import QLabelRenderer from './components/QLabelRenderer'
import QListRenderer from './components/QListRenderer'
import QTabsLayout from './components/QTabsLayout'
import QStepperLayout from './components/QStepperLayout'
import QJsonForm from './components/QJsonForm'

const version = __UI_VERSION__

function install (app) {
  app.component(QDateRenderer.name, QDateRenderer)
  app.component(QTimeRenderer.name, QTimeRenderer)
  app.component(QDateTimeRenderer.name, QDateTimeRenderer)
  app.component(QSelectRenderer.name, QSelectRenderer)
  app.component(QOptionsRenderer.name, QOptionsRenderer)
  app.component(QNumberRenderer.name, QNumberRenderer)
  app.component(QRatingRenderer.name, QRatingRenderer)
  app.component(QSliderRenderer.name, QSliderRenderer)
  app.component(QStringRenderer.name, QStringRenderer)
  app.component(QToggleRenderer.name, QToggleRenderer)
  app.component(QSectionRenderer.name, QSectionRenderer)
  app.component(QListRenderer.name, QListRenderer)
  app.component(QLabelRenderer.name, QLabelRenderer)
  app.component(QTabsLayout.name, QTabsLayout)
  app.component(QStepperLayout.name, QStepperLayout)
  app.component(QJsonForm.name, QJsonForm)
}

export {
  version,
  QDateRenderer,
  QTimeRenderer,
  QDateTimeRenderer,
  QSelectRenderer,
  QOptionsRenderer,
  QNumberRenderer,
  QRatingRenderer,
  QSliderRenderer,
  QStringRenderer,
  QToggleRenderer,
  QSectionRenderer,
  QListRenderer,
  QLabelRenderer,
  QTabsLayout,
  QStepperLayout,
  QJsonForm,
  install
}
