/* eslint-disable @typescript-eslint/no-explicit-any */
// When a condition turns false, is the data of the hidden fields removed (as with ASF)?
import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'
import { unsetDataPath } from '../src/utils/visibility'

const schema = {
  type: 'object',
  properties: {
    flag: { type: 'boolean' },
    members: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
    note: { type: 'string' },
  },
}
const list = { type: 'Control', scope: '#/properties/members' }
const note = { type: 'Control', scope: '#/properties/note' }

async function hideAndGetData(uischema: any) {
  let wrapper: any
  let last: any
  wrapper = mountForm({
    schema,
    uischema,
    modelValue: { flag: true, members: [{ name: 'x' }], note: 'y' },
    'onUpdate:modelValue': (data: any) => {
      last = data
      wrapper?.setProps({ modelValue: data })
    },
  })
  await flush(5)
  await wrapper.setProps({ modelValue: { flag: false, members: [{ name: 'x' }], note: 'y' } })
  await flush(10)
  const data = last
  wrapper.unmount()
  return data
}

describe('unsetDataPath', () => {
  it('removes a nested value without mutating', () => {
    const data = { a: { b: 1, c: 2 }, d: 3 }
    expect(unsetDataPath(data, '/a/b')).toEqual({ a: { c: 2 }, d: 3 })
    expect(data).toEqual({ a: { b: 1, c: 2 }, d: 3 })
  })

  it('returns the same object when there is nothing to remove', () => {
    const data = { a: { c: 2 } }
    expect(unsetDataPath(data, '/a/b')).toBe(data)
    expect(unsetDataPath(data, '/x/y')).toBe(data)
  })

  it('unescapes pointer segments', () => {
    expect(unsetDataPath({ 'a/b': 1, 'c~d': 2 }, '/a~1b')).toEqual({ 'c~d': 2 })
    expect(unsetDataPath({ 'c~d': 2 }, '/c~0d')).toEqual({})
  })
})

describe('hidden fields are cleared', () => {
  it('rule on the control itself', async () => {
    const data = await hideAndGetData({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/flag' },
        { ...list, rules: { visible: 'flag == true' } },
        { ...note, rules: { visible: 'flag == true' } },
      ],
    })
    expect(data).toBeDefined()
    expect(data.members).toBeUndefined()
    expect(data.note).toBeUndefined()
  })

  it('rule on the enclosing layout (as converted from ASF)', async () => {
    const data = await hideAndGetData({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/flag' },
        { type: 'VerticalLayout', rules: { visible: 'flag == true' }, elements: [list, note] },
      ],
    })
    expect(data).toBeDefined()
    expect(data.members).toBeUndefined()
    expect(data.note).toBeUndefined()
  })
})

describe('hidden fields are cleared: edge cases', () => {
  const nestedSchema = {
    type: 'object',
    properties: {
      flag: { type: 'boolean' },
      funding: { type: 'object', properties: { body: { type: 'string' }, start: { type: 'string' } } },
      keep: { type: 'string' },
    },
  }
  const ui = (container: string) => ({
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/flag' },
      {
        type: container,
        label: 'Funding',
        rules: { visible: 'flag == true' },
        elements: [{ type: 'Control', scope: '#/properties/funding/properties/body' }],
      },
      { type: 'Control', scope: '#/properties/keep' },
    ],
  })

  it('Group container, nested path, parent without v-model echo', async () => {
    const emitted: any[] = []
    const wrapper = mountForm({
      schema: nestedSchema,
      uischema: ui('Group'),
      modelValue: { flag: true, funding: { body: 'b', start: 's' }, keep: 'k' },
      'onUpdate:modelValue': (data: any) => emitted.push(data),
    })
    await flush(5)
    await wrapper.setProps({ modelValue: { flag: false, funding: { body: 'b', start: 's' }, keep: 'k' } })
    await flush(10)
    // only the hidden control's value goes: the sibling property not in the form stays
    expect(emitted[emitted.length - 1]).toEqual({ flag: false, funding: { start: 's' }, keep: 'k' })
    // a later edit elsewhere does not bring the cleared value back (JSON Forms state updated too)
    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[inputs.length - 1]!.setValue('k2')
    await flush(10)
    expect(emitted[emitted.length - 1]).toEqual({ flag: false, funding: { start: 's' }, keep: 'k2' })
    wrapper.unmount()
  })

  it('values hidden at load are kept (only a change of visibility clears)', async () => {
    const emitted: any[] = []
    const wrapper = mountForm({
      schema: nestedSchema,
      uischema: ui('VerticalLayout'),
      modelValue: { flag: false, funding: { body: 'b' }, keep: 'k' },
      'onUpdate:modelValue': (data: any) => emitted.push(data),
    })
    await flush(10)
    expect(emitted.every((d) => d.funding?.body === 'b')).toBe(true)
    wrapper.unmount()
  })
})

describe('hidden fields are cleared: list items', () => {
  const itemSchema = {
    type: 'object',
    properties: {
      flag: { type: 'boolean' },
      members: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' } }, required: ['role'] },
      },
    },
  }
  const uischema = {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/flag' },
      {
        type: 'Control',
        scope: '#/properties/members',
        options: {
          items: {
            type: 'VerticalLayout',
            elements: [
              { type: 'Control', scope: '#/properties/name' },
              { type: 'Group', label: 'Role', rules: { visible: 'flag == true' }, elements: [{ type: 'Control', scope: '#/properties/role' }] },
            ],
          },
        },
      },
    ],
  }

  it('clears the values of a hidden layout inside each item', async () => {
    const emitted: any[] = []
    const wrapper = mountForm({
      schema: itemSchema,
      uischema,
      modelValue: { flag: true, members: [{ name: 'a', role: 'r' }, { name: 'b', role: 's' }] },
      'onUpdate:modelValue': (data: any) => emitted.push(data),
    })
    await flush(5)
    await wrapper.setProps({ modelValue: { flag: false, members: [{ name: 'a', role: 'r' }, { name: 'b', role: 's' }] } })
    await flush(10)
    expect(emitted[emitted.length - 1]).toEqual({ flag: false, members: [{ name: 'a' }, { name: 'b' }] })
    wrapper.unmount()
  })

  it('does not report the errors of a hidden layout inside an item', async () => {
    const errors: any[][] = []
    const wrapper = mountForm({
      schema: itemSchema,
      uischema,
      modelValue: { flag: false, members: [{ name: 'a' }] },
      'onUpdate:errors': (e: any[]) => errors.push(e),
    })
    await flush(10)
    expect(errors[errors.length - 1] ?? []).toEqual([])
    wrapper.unmount()
  })
})
