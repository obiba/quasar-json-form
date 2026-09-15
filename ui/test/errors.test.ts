import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'
import { createFormErrorRegistry, toInstancePath } from '../src/composables/useFormErrors'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    even: {
      type: 'integer',
      title: 'Even',
      rules: { validation: [{ expr: 'even mod 2 == 0', message: 'must-be-even' }] },
    },
    gated: {
      type: 'string',
      title: 'Gated',
      rules: { visible: 'name == "show"', validation: [{ expr: 'gated == "ok"', message: 'not-ok' }] },
    },
  },
  required: ['name'],
}

const lastErrors = (wrapper: any) => {
  const emitted = wrapper.emitted('update:errors')!
  return emitted[emitted.length - 1]![0] as any[]
}

describe('renderer errors', () => {
  it('converts paths to instance paths', () => {
    expect(toInstancePath('')).toBe('')
    expect(toInstancePath('a')).toBe('/a')
    expect(toInstancePath('a.0.b')).toBe('/a/0/b')
    expect(toInstancePath('a/b.c~d')).toBe('/a~1b/c~0d')
  })

  it('collects errors per control and keyword', () => {
    const registry = createFormErrorRegistry()
    registry.set('a', 'k1', ['m1', 'm2'])
    registry.set('a', 'k2', ['m3'])
    expect(registry.errors.value.map((e) => e.message)).toEqual(['m1', 'm2', 'm3'])
    registry.set('a', 'k1', [])
    expect(registry.errors.value.map((e) => e.message)).toEqual(['m3'])
    registry.remove('a', 'k2')
    expect(registry.errors.value).toEqual([])
  })

  it('emits the filtrex validation errors with the AJV errors', async () => {
    const wrapper = mountForm({ schema, modelValue: { even: 3 } })
    await flush()
    const errors = lastErrors(wrapper)
    expect(errors.map((e) => [e.keyword, e.instancePath, e.message])).toEqual([
      ['required', '', "must have required property 'name'"],
      ['validation', '/even', 'must-be-even'],
    ])
    wrapper.unmount()
  })

  it('emits them in every validation mode and clears them when fixed', async () => {
    const wrapper = mountForm({ schema, modelValue: { name: 'x', even: 3 }, validationMode: 'NoValidation' })
    await flush()
    expect(lastErrors(wrapper).map((e) => e.keyword)).toEqual(['validation'])
    await wrapper.setProps({ modelValue: { name: 'x', even: 4 } })
    await flush()
    expect(lastErrors(wrapper)).toEqual([])
    wrapper.unmount()
  })

  it('ignores the errors of hidden controls', async () => {
    const wrapper = mountForm({ schema, modelValue: { name: 'x', gated: 'nope' } })
    await flush()
    expect(lastErrors(wrapper)).toEqual([])
    await wrapper.setProps({ modelValue: { name: 'show', gated: 'nope' } })
    await flush()
    expect(lastErrors(wrapper).map((e) => [e.keyword, e.instancePath])).toEqual([['validation', '/gated']])
    wrapper.unmount()
  })
})
