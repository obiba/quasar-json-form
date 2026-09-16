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
- `src/api/<Name>.json`: attributes of a renderer (triggers, options, validation, data), displayed with
  `<DocApi name="Name" />`. `_control.json` holds the options common to every control.
