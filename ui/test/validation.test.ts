import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name', minLength: 3 },
    age: { type: 'integer', title: 'Age', minimum: 18 },
    even: {
      type: 'integer',
      title: 'Even',
      rules: { validation: [{ expr: 'even % 2 == 0', message: 'must-be-even' }] },
    },
  },
  required: ['name'],
}

const fieldOf = (wrapper: any, index: number) => wrapper.findAll('.q-field')[index]

describe('schema validation', () => {
  it('shows the required error with the built-in message', async () => {
    const wrapper = mountForm({ schema, modelValue: {} })
    await flush()
    const name = fieldOf(wrapper, 0)
    expect(name.classes()).toContain('q-field--error')
    expect(name.find('.q-field__messages').text()).toBe('This field is required')
    expect(fieldOf(wrapper, 1).classes()).not.toContain('q-field--error')
    wrapper.unmount()
  })

  it('marks required controls in their label', async () => {
    const wrapper = mountForm({ schema, modelValue: { name: 'abc' } })
    await flush()
    expect(fieldOf(wrapper, 0).find('.q-field__label').text()).toBe('Name *')
    expect(fieldOf(wrapper, 1).find('.q-field__label').text()).toBe('Age')
    wrapper.unmount()
  })

  it('uses the application messages and interpolates AJV params', async () => {
    const wrapper = mountForm(
      { schema, modelValue: { name: 'ab', age: 3 } },
      { messages: { en: { error: { minimum: 'At least {limit}' } } } },
    )
    await flush()
    expect(fieldOf(wrapper, 0).find('.q-field__messages').text()).toBe('Must be at least 3 characters long')
    expect(fieldOf(wrapper, 1).find('.q-field__messages').text()).toBe('At least 18')
    wrapper.unmount()
  })

  it('translates in the current locale', async () => {
    const wrapper = mountForm({ schema, modelValue: {} }, { locale: 'fr' })
    await flush()
    expect(fieldOf(wrapper, 0).find('.q-field__messages').text()).toBe('Ce champ est requis')
    wrapper.unmount()
  })

  it('emits the errors and hides them in ValidateAndHide mode', async () => {
    const wrapper = mountForm({ schema, modelValue: {}, validationMode: 'ValidateAndHide' })
    await flush()
    expect(fieldOf(wrapper, 0).classes()).not.toContain('q-field--error')
    const emitted = wrapper.emitted('update:errors')!
    expect(emitted.length).toBeGreaterThan(0)
    const errors = emitted[emitted.length - 1]![0] as any[]
    expect(errors.map((e) => e.keyword)).toEqual(['required'])
    wrapper.unmount()
  })

  it('emits no error in NoValidation mode', async () => {
    const wrapper = mountForm({ schema, modelValue: {}, validationMode: 'NoValidation' })
    await flush()
    expect(fieldOf(wrapper, 0).classes()).not.toContain('q-field--error')
    const emitted = wrapper.emitted('update:errors')!
    expect(emitted[emitted.length - 1]![0]).toEqual([])
    wrapper.unmount()
  })

  it('still evaluates filtrex validation rules', async () => {
    const wrapper = mountForm({ schema, modelValue: { name: 'abc', even: 3 } })
    await flush()
    const even = fieldOf(wrapper, 2)
    expect(even.classes()).toContain('q-field--error')
    expect(even.find('.q-field__messages').text()).toBe('must-be-even')
    wrapper.unmount()
  })

  it('treats an emptied text input as a missing value', async () => {
    const wrapper = mountForm({ schema, modelValue: { name: 'abc' } })
    await flush()
    await fieldOf(wrapper, 0).find('input').setValue('')
    await flush()
    const emitted = wrapper.emitted('update:modelValue')!
    const data = emitted[emitted.length - 1]![0] as any
    expect(data.name).toBeUndefined()
    expect(fieldOf(wrapper, 0).find('.q-field__messages').text()).toBe('This field is required')
    wrapper.unmount()
  })

  it('treats an emptied number input as a missing value', async () => {
    const wrapper = mountForm({ schema, modelValue: { name: 'abc', age: 20 } })
    await flush()
    await fieldOf(wrapper, 1).find('input').setValue('')
    await flush()
    const emitted = wrapper.emitted('update:modelValue')!
    const data = emitted[emitted.length - 1]![0] as any
    expect(data.age).toBeUndefined()
    wrapper.unmount()
  })

  it('shows additional errors', async () => {
    const wrapper = mountForm({
      schema,
      modelValue: { name: 'abc' },
      additionalErrors: [{ keyword: 'server', instancePath: '/name', schemaPath: '#/properties/name', params: {}, message: 'taken' }],
    })
    await flush()
    expect(fieldOf(wrapper, 0).find('.q-field__messages').text()).toBe('This value is not valid')
    wrapper.unmount()
  })
})

describe('validationMessage default fallback', () => {
  it('uses options.validationMessage.default when the named message is missing', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { text: { type: 'string', title: 'Text' } } },
      uischema: { type: 'Control', scope: '#/properties/text', options: { wordLimit: '0:2', validationMessage: { default: 'Custom message' } } },
      modelValue: { text: 'one two three' },
    })
    await flush()
    expect(wrapper.text()).toContain('Custom message')
    wrapper.unmount()
  })
})
