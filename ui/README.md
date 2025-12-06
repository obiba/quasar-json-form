# Component QJsonForm

[![npm](https://img.shields.io/npm/v/@obiba/quasar-ui-json-form.svg?label=@obiba/quasar-ui-json-form)](https://www.npmjs.com/package/@obiba/quasar-ui-json-form)
[![npm](https://img.shields.io/npm/dt/@obiba/quasar-ui-json-form.svg)](https://www.npmjs.com/package/@obiba/quasar-ui-json-form)

**Compatible with Quasar UI v2 and Vue 3**.


# Component QJsonForm
> Short description of the component




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

## UMD variant

Exports `window.qJsonForm`.

Add the following tag(s) after the Quasar ones:

```html
<head>
  <!-- AFTER the Quasar stylesheet tags: -->
  <link href="https://cdn.jsdelivr.net/npm/@obiba/quasar-ui-json-form/dist/index.min.css" rel="stylesheet" type="text/css">
</head>
<body>
  <!-- at end of body, AFTER Quasar script(s): -->
  <script src="https://cdn.jsdelivr.net/npm/@obiba/quasar-ui-json-form/dist/index.umd.min.js"></script>
</body>
```
If you need the RTL variant of the CSS, then go for the following (instead of the above stylesheet link):
```html
<link href="https://cdn.jsdelivr.net/npm/@obiba/quasar-ui-json-form/dist/index.rtl.min.css" rel="stylesheet" type="text/css">
```

# Setup
```bash
$ npm install
```

# Developing
```bash
# start dev in SPA mode
$ npm run dev

# start dev in UMD mode
$ npm run dev:umd

# start dev in SSR mode
$ npm run dev:ssr

# start dev in Cordova iOS mode
$ npm run dev:ios

# start dev in Cordova Android mode
$ npm run dev:android

# start dev in Electron mode
$ npm run dev:electron
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
