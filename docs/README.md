# Documentation site

Quasar SPA published on GitHub Pages at https://www.obiba.org/quasar-json-form/ on every push to
`master` (`.github/workflows/docs.yaml`). It consumes the library sources from `../ui/src`, so
`ui` must be installed first (`make install` does both).

```bash
npm run dev      # http://localhost:9000
npm run build    # dist/spa, served under DOCS_PUBLIC_PATH (default `/`)
```

- `src/pages/**/*.md`: one page per entry of `src/menu.ts` (the route is the file path).
- `src/examples/<group>/<name>.ts`: live examples, `export default { schema, uischema, data?, config?, languages? }`,
  displayed with `<DocExample name="group/name" title="..." />`.
- `<DocApi name="Name" />`: attributes of a renderer (triggers, options, validation, data), read from
  the library catalog (`../ui/src/catalog`, checked by `ui/test/catalog.test.ts`), or of the form
  builder (`builderApi` of `../ui/src/builder`).
- `<DocPlayground />`, `<DocAsfPlayground />`, `<DocBuilder />`: the playgrounds, full width.
