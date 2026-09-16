/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { resolveSchema } from '@jsonforms/core'
import { convert } from '../src/asf'
import { mountForm, flush } from './utils'

interface Fixture {
  name: string
  schema: any
  definition: any
}

const files = import.meta.glob('./fixtures/asf/*.json', { eager: true, import: 'default' }) as Record<string, { schema: any; definition: any }>
const fixtures: Fixture[] = Object.keys(files)
  .sort()
  .map((path) => ({ name: path.replace(/^.*\//, '').replace(/\.json$/, ''), ...files[path]! }))

/** every Control scope of the UI schema, resolved against the schema it is relative to */
function checkScopes(element: any, schema: any, rootSchema: any, unresolved: string[]): void {
  if (!element || typeof element !== 'object') return
  if (element.type === 'Control') {
    const resolved = resolveSchema(schema, element.scope, rootSchema)
    if (!resolved) unresolved.push(element.scope)
    else if (element.options?.items) checkScopes(element.options.items, resolved.items, rootSchema, unresolved)
    return
  }
  ;(element.elements || []).forEach((child: any) => checkScopes(child, schema, rootSchema, unresolved))
}

/**
 * Diagnostics expected on the default forms as shipped by Mica: the project
 * form lists a `title` key that its schema does not declare.
 */
const expectedDiagnostics: Record<string, string[]> = {
  'project-form': ["warn: key 'title' is not defined in the schema"],
}

function countControls(element: any): number {
  if (!element || typeof element !== 'object') return 0
  if (element.type === 'Control') return 1
  return (element.elements || []).reduce((sum: number, child: any) => sum + countControls(child), 0)
}

describe('ASF converter on the Mica default forms', () => {
  it('has the 13 default forms', () => {
    expect(fixtures.map((f: Fixture) => f.name).sort()).toEqual([
      'collected-dataset-form',
      'data-access-agreement-form',
      'data-access-amendment-form',
      'data-access-feasibility-form',
      'data-access-form',
      'data-access-preliminary-form',
      'data-collection-event-form',
      'harmonization-study-form',
      'harmonized-dataset-form',
      'individual-study-form',
      'network-form',
      'population-form',
      'project-form',
    ])
  })

  fixtures.forEach((fixture: Fixture) => {
    describe(fixture.name, () => {
      const result = convert(fixture.schema, fixture.definition, { logger: false })

      it('converts without unexpected diagnostics', () => {
        expect(result.diagnostics.map((d) => `${d.level}: ${d.message}`)).toEqual(expectedDiagnostics[fixture.name] || [])
      })

      it('matches the snapshot', async () => {
        await expect(JSON.stringify({ schema: result.schema, uischema: result.uischema }, null, 2) + '\n')
          .toMatchFileSnapshot(`./fixtures/asf/__snapshots__/${fixture.name}.json`)
      })

      it('produces resolvable scopes and no t() token', () => {
        const unresolved: string[] = []
        checkScopes(result.uischema, result.schema, result.schema, unresolved)
        expect(unresolved).toEqual([])
        expect(countControls(result.uischema)).toBeGreaterThan(0)
        expect(JSON.stringify(result)).not.toMatch(/(?<![A-Za-z0-9_])t\(/)
      })

      it('renders with QJsonForm', async () => {
        const wrapper = mountForm({ schema: result.schema, uischema: result.uischema, modelValue: {}, languages: ['en', 'fr'] })
        await flush()
        expect(wrapper.text()).not.toContain('No applicable renderer')
        expect(wrapper.findAll('.q-field, .q-option-group, .q-radio-matrix, .q-file-list, .q-label-renderer').length).toBeGreaterThan(0)
        wrapper.unmount()
      })
    })
  })
})
