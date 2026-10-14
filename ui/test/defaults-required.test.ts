/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'
import { fillDefaults } from '../src/utils/defaults'
import { errorDataPath } from '../src/utils/visibility'

const lastOf = (wrapper: any, event: string) => {
  const emitted = wrapper.emitted(event)
  return emitted ? emitted[emitted.length - 1]![0] : undefined
}

describe('fillDefaults', () => {
  const schema = {
    type: 'object',
    properties: {
      age: { type: 'number', default: 18 },
      name: { type: 'string' },
      group: { type: 'object', properties: { level: { type: 'integer', default: 5 }, tags: { type: 'array', default: ['a'] } } },
    },
  }

  it('sets the defaults of the properties without a value, nested ones too', () => {
    const data = { name: 'x', group: { level: 2 } }
    const result = fillDefaults(schema, data)
    expect(result.data).toEqual({ name: 'x', age: 18, group: { level: 2, tags: ['a'] } })
    expect(result.paths).toEqual(['/age', '/group/tags'])
    expect(data).toEqual({ name: 'x', group: { level: 2 } })
  })

  it('returns the same data when there is nothing to set', () => {
    const data = { age: 0, group: { level: 1, tags: [] } }
    expect(fillDefaults(schema, data)).toEqual({ data, paths: [] })
    expect(fillDefaults(schema, data).data).toBe(data)
  })

  it('copies the default values', () => {
    const { data } = fillDefaults(schema, {})
    expect(data.group.tags).not.toBe(schema.properties.group.properties.tags.default)
  })
})

describe('applyDefaults', () => {
  const schema = {
    type: 'object',
    properties: {
      age: { type: 'number', default: 18 },
      flag: { type: 'boolean', default: false },
      note: { type: 'string', default: 'n' },
    },
  }
  const uischema = {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/age' },
      { type: 'Control', scope: '#/properties/flag' },
      { type: 'Control', scope: '#/properties/note', rules: { visible: 'flag == true' } },
    ],
  }

  it('emits the data with the defaults, except the hidden ones', async () => {
    const wrapper = mountForm({ schema, uischema, modelValue: {}, applyDefaults: true })
    await flush()
    expect(lastOf(wrapper, 'update:modelValue')).toEqual({ age: 18, flag: false })
    wrapper.unmount()
  })

  it('keeps the values already set', async () => {
    const wrapper = mountForm({ schema, uischema, modelValue: { age: 3, flag: true }, applyDefaults: true })
    await flush()
    expect(lastOf(wrapper, 'update:modelValue')).toEqual({ age: 3, flag: true, note: 'n' })
    wrapper.unmount()
  })

  it('does nothing without the prop', async () => {
    const wrapper = mountForm({ schema, uischema, modelValue: {} })
    await flush()
    expect(lastOf(wrapper, 'update:modelValue')?.age).toBeUndefined()
    wrapper.unmount()
  })
})

describe('required rule', () => {
  const schema = {
    type: 'object',
    properties: {
      flag: { type: 'boolean' },
      reason: { type: 'string', title: 'Reason', rules: { required: 'flag == true' } },
      tags: { type: 'array', uniqueItems: true, items: { enum: ['a', 'b'] } },
    },
  }
  const uischema = {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/flag' },
      { type: 'Control', scope: '#/properties/reason' },
      { type: 'Control', scope: '#/properties/tags', rules: { required: 'flag == true' } },
    ],
  }
  const keys = (errors: any[] = []) => errors.map((e) => `${e.keyword}:${errorDataPath(e)}`)

  it('marks the control and reports the missing value while true', async () => {
    const wrapper = mountForm({ schema, uischema, modelValue: { flag: true, tags: [] } })
    await flush()
    expect(wrapper.find('.q-form-title').text()).toContain('*')
    expect(keys(lastOf(wrapper, 'update:errors'))).toEqual(['required:/reason', 'required:/tags'])

    await wrapper.setProps({ modelValue: { flag: true, reason: 'r', tags: ['a'] } })
    await flush()
    expect(keys(lastOf(wrapper, 'update:errors'))).toEqual([])

    await wrapper.setProps({ modelValue: { flag: false } })
    await flush()
    expect(wrapper.find('.q-form-title').text()).not.toContain('*')
    expect(keys(lastOf(wrapper, 'update:errors'))).toEqual([])
    wrapper.unmount()
  })

  it('does not report the errors of a disabled control', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { ...uischema, elements: [uischema.elements[0], { ...uischema.elements[1], rules: { enabled: 'flag == false' } }] },
      modelValue: { flag: true },
    })
    await flush()
    expect(keys(lastOf(wrapper, 'update:errors'))).toEqual([])
    wrapper.unmount()
  })
})
