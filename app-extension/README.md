# Quasar App Extension json-form

[![npm](https://img.shields.io/npm/v/@obiba/quasar-app-extension-json-form.svg?label=@obiba/quasar-app-extension-json-form)](https://www.npmjs.com/package/@obiba/quasar-app-extension-json-form)
[![npm](https://img.shields.io/npm/dt/@obiba/quasar-app-extension-json-form.svg)](https://www.npmjs.com/package/@obiba/quasar-app-extension-json-form)

This app extension integrates the `QJsonForm` component into your Quasar CLI project, enabling schema-driven form generation using JSON Schema. It automatically registers the component and its dependencies, so you can render complex, dynamic forms with Quasar-styled inputs without any manual setup. `QJsonForm` uses [JSON Forms](https://jsonforms.io/).

# Requirements
- `@quasar/app-vite` v3+ (Quasar CLI with Vite)
- `quasar` v2

Quasar CLI with Webpack (`@quasar/app-webpack`) is no longer supported. Use version 0.1.1 of this
extension if you are still on `@quasar/app-vite` v1/v2 or on `@quasar/app-webpack`.

# Install
```bash
quasar ext add @obiba/json-form
```
Quasar CLI will retrieve it from NPM and install the extension.

# Uninstall
```bash
quasar ext remove @obiba/json-form
```

# Donate
If you appreciate the work that went into this App Extension, please consider [donating to Quasar](https://donate.quasar.dev).

# License
MIT (c) Yannick Marcon <yannick.marcon@obiba.org>
