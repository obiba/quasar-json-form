<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          to="/"
          icon="home"
        />

        <q-toolbar-title>
          @obiba/quasar-ui-json-form v{{ version }}
        </q-toolbar-title>

        <q-btn-dropdown flat dense :label="locale" class="on-left">
          <q-list>
            <q-item
              clickable
              v-close-popup
              @click="onLocaleSelection(localeOpt)"
              v-for="localeOpt in localeOptions"
              :key="localeOpt.value"
            >
              <q-item-section>
                <q-item-label>{{ localeOpt.label }}</q-item-label>
              </q-item-section>
              <q-item-section avatar v-if="locale === localeOpt.value">
                <q-icon color="primary" name="check" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { version } from 'ui' // "ui" is aliased in quasar.conf.js
import { useI18n } from 'vue-i18n'


export default {
  name: 'MyLayout',

  setup () {
    const { locale, t } = useI18n()
    const localeOptions = [
      { label: 'EN', value: 'en' },
      { label: 'FR', value: 'fr' }
    ]
    return {
      version,
      locale,
      t,
      localeOptions,
      onLocaleSelection (localeOpt) {
        locale.value = localeOpt.value
      }
    }
  }
}
</script>
