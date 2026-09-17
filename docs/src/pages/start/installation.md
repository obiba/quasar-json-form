---
title: Installation
---

# Installation

## Requirements

- Quasar v2, Vue 3.
- [vue-i18n](https://vue-i18n.intlify.dev/) v11 registered in the application with `app.use(i18n)`
  (composition mode, `legacy: false`). Every title, description, option label, hint and message is
  passed through `t()`, so they can be either i18n keys or literal strings: an unknown key is
  displayed as-is (set `missingWarn: false` to silence vue-i18n). Without vue-i18n the forms still
  render untranslated, with english validation messages, and a warning is logged once.

## Quasar CLI project

Install the app extension, which registers the component and its stylesheet:

```bash
quasar ext add @obiba/json-form
```

It requires `@quasar/app-vite` v3+. Quasar CLI with Webpack is no longer supported (use version
0.1.1 of the extension for `@quasar/app-vite` v1/v2 or `@quasar/app-webpack`).

## Vue plugin

Without the app extension, install the UI package and register the plugin in a boot file
(Quasar CLI) or in `main.js` (Vite / Vue CLI):

```bash
npm install @obiba/quasar-ui-json-form
```

```js
import { createApp } from 'vue'
import Plugin from '@obiba/quasar-ui-json-form'
import '@obiba/quasar-ui-json-form/dist/index.css'

createApp(App).use(Plugin)
```

The `@jsonforms/vue` renderers are written with the Options API: in a Quasar CLI project set
`build.vueOptionsAPI: true` in `quasar.config` (it is the default).

## Single component

```html
<script setup>
import { QJsonForm } from '@obiba/quasar-ui-json-form'
import '@obiba/quasar-ui-json-form/dist/index.css'
</script>
```

## Entries

The package has separate entries for what a form does not need at runtime; none is registered
by the plugin or the app extension, import them where they are used:

```js
import { convert } from '@obiba/quasar-ui-json-form/asf'              // angular-schema-form converter
import { catalog } from '@obiba/quasar-ui-json-form/catalog'          // renderer descriptions
import { QJsonFormBuilder } from '@obiba/quasar-ui-json-form/builder' // form builder
```

The [builder](#/builder/overview) imports the main entry rather than bundling a copy of it (its
preview is a `QJsonForm`), and its styles are part of `dist/index.css`.

## Validation messages

Keys missing from the application bundles fall back to the library defaults (english and french),
exported as `messages`. To customize them, merge them into your own bundles:

```js
import { messages } from '@obiba/quasar-ui-json-form'

createI18n({ messages: { en: { ...messages.en, ...appEn } } })
```

## UMD

The `dist` folder also contains `index.umd.js` and `index.css`, exposing `QJsonForm` on
`window.QJsonForm`, for pages loading Vue and Quasar from a CDN.
