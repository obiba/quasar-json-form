---
title: Model
---

# Model

<p class="doc-lead">The builder works on a model of the form under construction, pure TypeScript exported by the <code>builder</code> entry: a tree of nodes mirroring the UI schema, bound to the JSON schema of the data and to the translations of the form.</p>

An application can use it without the component: to generate a form, to migrate a batch of
angular-schema-form definitions, or to check the translations of a form on the server side.

```js
import { fromDefinition, toDefinition, addNode, setText, textSlots } from '@obiba/quasar-ui-json-form/builder'
import { findCatalogItem } from '@obiba/quasar-ui-json-form/catalog'

const model = fromDefinition({ schema, uischema, translations })
const node = addNode(model, model.root.id, findCatalogItem('textarea'), undefined, 'comment')
setText(model, node, textSlots(model, node)[0], 'en', 'Your comment')  // schema title: `comment.title`
const { schema, uischema, translations } = toDefinition(model)
```

## Nodes

A `FormModel` holds the `schema`, the `root` node, the `translations` (flat dotted keys, one map
per language) and the `diagnostics` of the import. Each `FormNode` has a `kind`:

| Kind | Element | Holds |
|---|---|---|
| `layout` | any element with `elements`: `VerticalLayout`, `HorizontalLayout`, `Group`, `Categorization`, `TabsLayout`, `StepperLayout`... | its `children` |
| `control` | `Control` | its `path` in the container object schema (`['address', 'street']` for `#/properties/address/properties/street`); a list of objects also holds the layout of its items (`options.items`) as `detail` |
| `element` | anything else (`Label`, `Section`, an unknown type) | nothing |

The `element` of a node is its UI schema element without the `scope`, `elements` and
`options.items` the tree represents. Node ids are unique in the model and not persisted.

## Conversion

- `fromDefinition(definition)` copies the form: a missing UI schema is generated with one control
  per property, nested translations are flattened to dotted keys. The keywords of the schema and of
  the elements the model does not understand stay attached to their node and are written back by
  `toDefinition`. A control whose scope is not a chain of `properties` (through a `$ref`, an
  object-level `oneOf`...) keeps its scope on its element as-is, editable as JSON only, with a
  diagnostic.
- `toDefinition(model)` returns the `{ schema, uischema, translations }` bundle.
- `fromAsf(schema, definition, options?)` converts an [angular-schema-form pair](#/migration/overview)
  with the converter of the `asf` entry, and turns its diagnostics into model diagnostics.

## Operations

Every operation keeps the schema in step with the tree:

| Function | Effect |
|---|---|
| `addNode(model, parentId, template, index?, key?)` | Adds a node made from a template (a catalog item, or any `{ schema?, uischema }` pair) under a layout. A control template creates its property in the container of the layout, the root schema or the `items` of its list, under `key` made unique (`field` by default) |
| `removeNode(model, id)` | Removes the node and its descendants; the property of a control is removed unless another control still uses it |
| `moveNode(model, id, parentId, index?)`, `canMove(model, id, parentId)` | Reorders or reparents a node. A control stays at its level: it cannot move into or out of the items of a list |
| `duplicateNode(model, id)` | Copies the node next to itself; the property of a control is copied under a new key |
| `renameProperty(model, id, key)` | Renames the property of a control and rewrites the scopes of the nested controls; false when the key is invalid or taken |
| `ruleReferences(model, name)` | The filtrex rules of the form mentioning a property, to review after a rename |
| `locate(model, id)`, `findNode`, `locations`, `descendants`, `listOf`, `propertySchema`, `isRequired`, `setRequired` | Navigation and property helpers |

## Texts

Every text of a form is a translation key, and the model reads and writes the texts in a language:

- `textSlots(model, node)` lists the texts of a node: `title`, `description`, `label`, `hint`,
  `text`, `options.<value>` for the option labels, `labels.<i>` for the tabs and steps,
  `validation.<i>` for the messages of the validation rules.
- `getText(model, node, slot, locale)` and `setText(model, node, slot, locale, text)` read and
  write a text. Writing generates the key when the slot holds nothing or a literal
  (`textKey`, from the position of the node: `name.title`, `contacts.items.email.hint`,
  `group.1.label`), and stores the text in the translations of the language.
- `collectKeys(model, languages, locale)` turns every literal of an imported form into a key and
  adds the missing entries of every language; `usedKeys`, `missingTranslations(model, locale)`
  and `pruneTranslations(model)` serve the translations editor.
- `translationsToCsv(model, languages)`, `parseCsv(text)` and `mergeCsv(model, text)` exchange
  the translations as CSV, `key` then one column per language.
