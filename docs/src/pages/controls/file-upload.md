---
title: File upload
---

# File upload

<p class="doc-lead">The <code>file</code> and <code>files</code> formats render an upload button and the list of uploaded files.</p>

| Schema | Data |
|---|---|
| `type: string, format: file` | the uploaded file path |
| `type: array, format: files` | a list of file items `[{ id, fileName, size, ... }]` |
| `type: object, format: files` / `obibaFiles` | `{ [itemsKey]: [...] }` (`itemsKey` is `obibaFiles` for that format, `files` otherwise) |

Files are uploaded as soon as they are picked, either through the `config.fileUpload` hooks of
`QJsonForm` or through the declarative `uploadUrl` flow. This example simulates the uploads with
hooks (see the Config tab); the title and description are displayed above the list, the hint under
it, and `label` (on the control element or the schema property) sets the button label.

<DocExample name="file-upload/hooks" title="Hooks: object, array and path controls" source />

## Declarative flow

Without an `upload` hook, the file is `POST`ed to `uploadUrl` as multipart form data (`fileField`,
`uploadHeaders`, `uploadMethod`). The stored item is then read from the JSON response (`pathKey`,
or the whole body) or, when `metadataUrl` is set, fetched with the id found in the `Location`
header: the Mica temporary file flow is `uploadUrl: "/ws/files/temp"` and
`metadataUrl: "/ws/files/temp/{id}"`. Uploaded items get `justUploaded: true`, and removing one
calls `deleteUrl` when set. `downloadUrl` is a template over the item properties used as link.

`minItems` / `maxItems` from the schema (or the filtrex `min` / `max` rules) bound the number of
files; `multiple` defaults to true unless `maxItems` is 1. There is no server behind this example:
picking a file shows the upload failure.

<DocExample name="file-upload/declarative" title="Mica flow" />

## API

<DocApi name="QFileUploadRenderer" />
