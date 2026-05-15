# Component QJsonForm

[![npm](https://img.shields.io/npm/v/@obiba/quasar-ui-json-form.svg?label=@obiba/quasar-ui-json-form)](https://www.npmjs.com/package/@obiba/quasar-ui-json-form)
[![npm](https://img.shields.io/npm/dt/@obiba/quasar-ui-json-form.svg)](https://www.npmjs.com/package/@obiba/quasar-ui-json-form)

**Compatible with Quasar UI v2 and Vue 3**.

A Quasar UI component that renders dynamic, schema-driven forms based on a JSON Schema and an optional UI schema, using [JSON Forms](https://jsonforms.io/) renderers styled with Quasar components.

# Usage

## Quasar CLI project


Install the [App Extension](../app-extension).

**OR**:


Create and register a boot file:

```js
import Vue from 'vue'
import Plugin from '@obiba/quasar-ui-json-form'
import '@obiba/quasar-ui-json-form/dist/index.css'

Vue.use(Plugin)
```

**OR**:

```html
<style src="@obiba/quasar-ui-json-form/dist/index.css"></style>

<script>
import { Component as QJsonForm } from '@obiba/quasar-ui-json-form'

export default {
  
  components: {
    QJsonForm
  }
  
  
}
</script>
```

## Vue CLI project

```js
import Vue from 'vue'
import Plugin from '@obiba/quasar-ui-json-form'
import '@obiba/quasar-ui-json-form/dist/index.css'

Vue.use(Plugin)
```

**OR**:

```html
<style src="@obiba/quasar-ui-json-form/dist/index.css"></style>

<script>
import { Component as QJsonForm } from '@obiba/quasar-ui-json-form'

export default {
  
  components: {
    QJsonForm
  }
  
  
}
</script>
```

# Setup
```bash
$ npm install
```

# Developing
```bash
$ npm run dev
```

# Building package
```bash
$ npm run build
```

# Adding Testing Components
in the `ui/dev/src/pages` you can add Vue files to test your component/directive. When using `npm run dev` to build the UI, any pages in that location will automatically be picked up by dynamic routing and added to the test page.

# Adding Assets
If you have a component that has assets, like language or icon-sets, you will need to provide these for UMD. In the `ui/build/script.javascript.js` file, you will find a couple of commented out commands that call `addAssets`. Uncomment what you need and add your assets to have them be built and put into the `ui/dist` folder.

# Donate
If you appreciate the work that went into this, please consider [donating to Quasar](https://donate.quasar.dev).

# License
MIT (c) Yannick Marcon <yannick.marcon@obiba.org>
