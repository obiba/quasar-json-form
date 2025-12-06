import { h } from 'vue'
import { QBadge } from 'quasar'

export default {
  name: 'QJsonForm',

  setup () {
    return () => h(QBadge, {
      class: 'QJsonForm',
      label: 'QJsonForm'
    })
  }
}
