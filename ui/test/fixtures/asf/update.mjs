#!/usr/bin/env node
/**
 * Refreshes the angular-schema-form fixtures from a Mica checkout:
 *
 *   node test/fixtures/asf/update.mjs ../../mica2
 *
 * Each fixture is the `{ schema, definition }` pair served by Mica for one
 * entity form: the mandatory part is merged into the customizable part the way
 * `EntityConfigService` does (mandatory properties and required names added to
 * the schema, mandatory definition elements first).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const mica = resolve(process.argv[2] || '../../mica2')
const config = join(mica, 'mica-core/src/main/resources/config')

// fixture name → [form folder, schema, definition, mandatory schema, mandatory definition]
const forms = {
  'data-access-form': ['data-access-form', 'schema.json', 'definition.json'],
  'data-access-preliminary-form': ['data-access-preliminary-form', 'schema.json', 'definition.json'],
  'data-access-feasibility-form': ['data-access-feasibility-form', 'schema.json', 'definition.json'],
  'data-access-amendment-form': ['data-access-amendment-form', 'schema.json', 'definition.json'],
  'data-access-agreement-form': ['data-access-agreement-form', 'schema.json', 'definition.json'],
  'network-form': ['network-form', 'schema.json', 'definition.json', 'schema-mandatory.json', 'definition-mandatory.json'],
  'project-form': ['project-form', 'schema.json', 'definition.json', 'schema-mandatory.json', 'definition-mandatory.json'],
  'individual-study-form': ['study-form', 'collection-schema.json', 'collection-definition.json', 'schema-mandatory.json', 'definition-mandatory.json'],
  'harmonization-study-form': ['study-form', 'harmonization-schema.json', 'harmonization-definition.json', 'harmonization-schema-mandatory.json', 'harmonization-definition-mandatory.json'],
  'population-form': ['population-form', 'schema.json', 'definition.json', 'schema-mandatory.json', 'definition-mandatory.json'],
  'data-collection-event-form': ['data-collection-event-form', 'schema.json', 'definition.json', 'schema-mandatory.json', 'definition-mandatory.json'],
  'collected-dataset-form': ['dataset-form', 'schema.json', 'definition.json', 'schema-mandatory.json', 'definition-mandatory.json'],
  'harmonized-dataset-form': ['dataset-form', 'harmonization-schema.json', 'harmonization-definition.json', 'schema-mandatory.json', 'definition-mandatory.json'],
}

function read(folder, file) {
  return JSON.parse(readFileSync(join(config, folder, file), 'utf8'))
}

// EntityConfigService.mergeSchema: mandatory properties replace the custom ones, required names are appended
function mergeSchema(base, override) {
  if (!override || override.type === undefined) return base
  base.properties = base.properties || {}
  Object.entries(override.properties || {}).forEach(([name, value]) => {
    base.properties[name] = value
  })
  base.required = base.required || []
  ;(override.required || []).forEach((name) => {
    if (!base.required.includes(name)) base.required.push(name)
  })
  return base
}

Object.entries(forms).forEach(([name, [folder, schemaFile, definitionFile, mandatorySchemaFile, mandatoryDefinitionFile]]) => {
  let schema = read(folder, schemaFile)
  let definition = read(folder, definitionFile)
  if (mandatorySchemaFile) {
    schema = mergeSchema(schema, read(folder, mandatorySchemaFile))
    definition = [...read(folder, mandatoryDefinitionFile), ...definition]
  }
  const target = join(here, `${name}.json`)
  writeFileSync(target, JSON.stringify({ schema, definition }, null, 2) + '\n')
  console.log(`${name}: ${Object.keys(schema.properties || {}).length} properties, ${definition.length} definition elements`)
})
