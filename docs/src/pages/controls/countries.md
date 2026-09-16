---
title: Countries
---

# Countries

<p class="doc-lead"><code>format: "countries"</code> is a searchable select of country codes, single or multiple.</p>

The `[{ code, name }]` list comes from `options.countries`, `config.countries` or a
`jsonforms-countries` provide of the application, either an array or a `{ locale: [...] }` map
(the current vue-i18n locale is used). The `countryCodes` export holds the ISO 3166-1 alpha-3 codes
with english and french names.

<DocExample name="countries/basic" title="Single and multiple, with countryCodes" source />

## Custom list

<DocExample name="countries/custom" title="Countries from the control options" />

## API

<DocApi name="QCountriesRenderer" />
