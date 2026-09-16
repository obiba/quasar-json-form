import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'object', format: 'localizedString', title: 'Name' },
    summary: { type: 'object', format: 'obibaSimpleMde', title: 'Summary' },
    notes: { type: 'object', format: 'localizedString', title: 'Notes', options: { rows: 3 } },
  },
  required: ['name'],
}

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const lastErrors = (wrapper: any) => {
  const emitted = wrapper.emitted('update:errors')!
  return emitted[emitted.length - 1]![0] as any[]
}

describe('localized string', () => {
  it('renders one input for the current language with a language selector', async () => {
    const wrapper = mountForm({ schema, languages: ['en', 'fr'], modelValue: { name: { en: 'Hello', fr: 'Bonjour' } } })
    await flush()
    const field = wrapper.find('.q-localized-string')
    expect(field.exists()).toBe(true)
    expect((field.find('input').element as HTMLInputElement).value).toBe('Hello')
    expect(field.find('.q-field__label').text()).toBe('Name *')
    const buttons = field.findAll('.q-localized-toggle .q-btn')
    expect(buttons.map((b) => b.text())).toEqual(['EN', 'FR'])
    await buttons[1]!.trigger('click')
    await flush()
    expect((field.find('input').element as HTMLInputElement).value).toBe('Bonjour')
    wrapper.unmount()
  })

  it('switches every localized control together', async () => {
    const wrapper = mountForm({ schema, languages: ['en', 'fr'], modelValue: { name: { en: 'Hello', fr: 'Bonjour' }, notes: { en: 'n-en', fr: 'n-fr' } } })
    await flush()
    const fields = wrapper.findAll('.q-localized-string')
    await fields[0]!.findAll('.q-localized-toggle .q-btn')[1]!.trigger('click')
    await flush()
    expect((fields[0]!.find('input').element as HTMLInputElement).value).toBe('Bonjour')
    expect((fields[2]!.find('textarea').element as HTMLTextAreaElement).value).toBe('n-fr')
    wrapper.unmount()
  })

  it('updates the value of the current language only', async () => {
    const wrapper = mountForm({ schema, languages: ['en', 'fr'], modelValue: { name: { en: 'Hello' } } })
    await flush()
    const field = wrapper.find('.q-localized-string')
    await field.findAll('.q-localized-toggle .q-btn')[1]!.trigger('click')
    await field.find('input').setValue('Bonjour')
    await flush()
    expect(lastData(wrapper).name).toEqual({ en: 'Hello', fr: 'Bonjour' })
    wrapper.unmount()
  })

  it('drops the value when every language is emptied, so that required applies', async () => {
    const wrapper = mountForm({ schema, languages: ['en'], modelValue: { name: { en: 'Hello' } } })
    await flush()
    await wrapper.find('.q-localized-string input').setValue('')
    await flush()
    expect(lastData(wrapper).name).toBeUndefined()
    expect(wrapper.find('.q-localized-string .q-field__messages').text()).toBe('This field is required')
    wrapper.unmount()
  })

  it('requires every language to be completed', async () => {
    const wrapper = mountForm({ schema, languages: ['en', 'fr'], modelValue: { name: { en: 'Hello' } } })
    await flush()
    const field = wrapper.find('.q-localized-string')
    expect(field.classes()).toContain('q-field--error')
    expect(field.find('.q-field__messages').text()).toBe('Must be completed in all languages')
    const errors = lastErrors(wrapper)
    expect(errors.map((e) => [e.keyword, e.instancePath])).toEqual([['completed', '/name']])
    wrapper.unmount()
  })

  it('flags an existing empty object and drops blank-only values', async () => {
    const wrapper = mountForm({ schema, languages: ['en', 'fr'], modelValue: { name: {} } })
    await flush()
    expect(wrapper.find('.q-localized-string .q-field__messages').text()).toBe('Must be completed in all languages')
    await wrapper.find('.q-localized-string input').setValue('x')
    await wrapper.find('.q-localized-string input').setValue('')
    await flush()
    expect(lastData(wrapper).name).toBeUndefined()
    wrapper.unmount()
  })

  it('uses the validationMessage option for the completed message', async () => {
    const wrapper = mountForm({
      schema,
      languages: ['en', 'fr'],
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/name', options: { validationMessage: { completed: 'all-langs' } } }] },
      modelValue: { name: { en: 'Hello' } },
    })
    await flush()
    expect(wrapper.find('.q-localized-string .q-field__messages').text()).toBe('all-langs')
    wrapper.unmount()
  })

  it('reads the languages from the control options, the config or the form prop', async () => {
    let wrapper = mountForm({ schema, config: { languages: { en: 'English', fr: 'Français' } }, modelValue: {} })
    await flush()
    expect(wrapper.find('.q-localized-string').findAll('.q-localized-toggle .q-btn').map((b) => b.text())).toEqual(['English', 'Français'])
    wrapper.unmount()

    wrapper = mountForm({
      schema,
      languages: ['en', 'fr'],
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/name', options: { languages: ['de'] } }] },
      modelValue: {},
    })
    await flush()
    expect(wrapper.find('.q-localized-toggle').exists()).toBe(false)
    wrapper.unmount()

    wrapper = mountForm({ schema, modelValue: {} })
    await flush()
    expect(wrapper.find('.q-localized-toggle').exists()).toBe(false)
    wrapper.unmount()
  })

  it('accepts an application-level languages provide', async () => {
    const wrapper = mountForm({ schema, modelValue: {} }, { provide: { 'jsonforms-languages': ['en', 'fr', 'de'] } })
    await flush()
    expect(wrapper.find('.q-localized-string').findAll('.q-localized-toggle .q-btn').map((b) => b.text())).toEqual(['EN', 'FR', 'DE'])
    wrapper.unmount()
  })

  it('passes the config and languages to controls inside lists', async () => {
    const wrapper = mountForm({
      schema: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { type: 'object', properties: { label: { type: 'object', format: 'localizedString', title: 'Label' } } } },
        },
      },
      config: { languages: ['en', 'fr'] },
      modelValue: { items: [{ label: { en: 'a', fr: 'b' } }] },
    })
    await flush()
    const field = wrapper.find('.q-list-renderer .q-localized-string')
    expect(field.exists()).toBe(true)
    expect(field.findAll('.q-localized-toggle .q-btn').map((b) => b.text())).toEqual(['EN', 'FR'])
    wrapper.unmount()
  })

  it('renders a markdown editor for obibaSimpleMde and marked options', async () => {
    const wrapper = mountForm({ schema, languages: ['en', 'fr'], modelValue: { summary: { en: 'some **bold** text' } } })
    await flush()
    const editor = wrapper.findAll('.q-markdown-editor')
    expect(editor.length).toBe(1)
    expect(editor[0]!.find('textarea').exists()).toBe(true)
    expect(editor[0]!.findAll('.q-localized-toggle .q-btn').length).toBe(2)
    await editor[0]!.find('.q-markdown-editor__preview-toggle').trigger('click')
    await flush()
    expect(editor[0]!.find('.q-markdown-editor__preview').html()).toContain('<strong>bold</strong>')
    expect(editor[0]!.find('textarea').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders the markdown of the current language when read-only', async () => {
    const wrapper = mountForm({ schema, languages: ['en', 'fr'], readonly: true, modelValue: { name: { en: 'Hello' }, summary: { en: '# Title', fr: '# Titre' } } })
    await flush()
    const editor = wrapper.find('.q-markdown-editor--readonly')
    expect(editor.find('.q-markdown-editor__preview').html()).toContain('<h1>Title</h1>')
    expect(editor.find('textarea').exists()).toBe(false)
    await editor.findAll('.q-localized-toggle .q-btn')[1]!.trigger('click')
    await flush()
    expect(editor.find('.q-markdown-editor__preview').html()).toContain('<h1>Titre</h1>')
    expect(wrapper.find('.q-localized-string.q-field').classes()).toContain('q-field--readonly')
    wrapper.unmount()
  })
})
