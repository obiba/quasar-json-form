# angular-schema-form fixtures

The 13 default entity forms of [Mica](https://github.com/obiba/mica2)
(`mica-core/src/main/resources/config/*-form`), each as the `{ schema, definition }` pair the
server serves (mandatory part merged as `EntityConfigService` does). They are the acceptance
fixtures of the ASF converter (`test/asf-fixtures.test.ts`): converted output snapshots in
`__snapshots__`, no diagnostics, every scope resolvable, and the converted form renders.

Refresh them from a Mica checkout with:

```
node test/fixtures/asf/update.mjs ../../mica2
```
