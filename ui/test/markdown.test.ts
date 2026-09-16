import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { mountForm, flush, createTestI18n } from './utils'
import QMarkdownEditor from '../src/components/QMarkdownEditor'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const schema = {
  type: 'object',
  properties: {
    body: { type: 'string', format: 'markdown', title: 'Body', description: 'Some help' },
    show: { type: 'boolean' },
  },
  required: ['body'],
}

describe('markdown renderer', () => {
  it('renders a markdown editor with the label, hint and rows option', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/body', options: { rows: 8, class: 'my-md', dense: true } },
      modelValue: { body: 'hello' },
    })
    await flush()
    const editor = wrapper.find('.q-markdown-editor')
    expect(editor.exists()).toBe(true)
    expect(editor.classes()).toContain('my-md')
    const textarea = editor.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('hello')
    expect(textarea.attributes('rows')).toBe('8')
    expect(editor.find('.q-field__label').text()).toBe('Body *')
    expect(editor.find('.q-field__messages').text()).toBe('Some help')
    expect(editor.find('.q-field').classes()).toContain('q-field--dense')
    wrapper.unmount()
  })

  it('updates the data and drops an emptied text so that required applies', async () => {
    const wrapper = mountForm({ schema, modelValue: { body: 'hello' } })
    await flush()
    const textarea = wrapper.find('.q-markdown-editor textarea')
    await textarea.setValue('changed')
    await flush()
    expect(lastData(wrapper).body).toBe('changed')
    await textarea.setValue('')
    await flush()
    expect(lastData(wrapper).body).toBeUndefined()
    expect(wrapper.find('.q-markdown-editor .q-field__messages').text()).toBe('This field is required')
    wrapper.unmount()
  })

  it('renders the markdown read-only with the label and hint', async () => {
    const wrapper = mountForm({ schema, readonly: true, modelValue: { body: 'a **bold** word' } })
    await flush()
    const editor = wrapper.find('.q-markdown-editor--readonly')
    expect(editor.exists()).toBe(true)
    expect(editor.find('textarea').exists()).toBe(false)
    expect(editor.find('.q-markdown-editor__toolbar').text()).toBe('Body *')
    expect(editor.find('.q-markdown-editor__preview').html()).toContain('<strong>bold</strong>')
    expect(editor.text()).toContain('Some help')
    wrapper.unmount()
  })

  it('shows the error instead of the hint read-only', async () => {
    const wrapper = mountForm({ schema, readonly: true, modelValue: {} })
    await flush()
    const editor = wrapper.find('.q-markdown-editor--readonly')
    expect(editor.find('.text-negative').text()).toBe('This field is required')
    expect(editor.text()).not.toContain('Some help')
    wrapper.unmount()
  })

  it('is disabled by an enabled rule and clears its value when hidden', async () => {
    const disabled = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/body', rules: { enabled: 'truthy(show)' } },
      modelValue: { body: 'x', show: false },
    })
    await flush()
    expect(disabled.find('.q-markdown-editor .q-field').classes()).toContain('q-field--disabled')
    expect(disabled.findAll('.q-markdown-editor__toolbar .q-btn').every((b) => b.classes().includes('disabled'))).toBe(true)
    disabled.unmount()

    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/body', rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { body: 'x', show: true },
    })
    await flush()
    expect(wrapper.find('.q-markdown-editor').exists()).toBe(true)
    await wrapper.setProps({ modelValue: { body: 'x', show: false } })
    await flush()
    expect(wrapper.find('.q-markdown-editor').exists()).toBe(false)
    expect(lastData(wrapper).body).toBeUndefined()
    wrapper.unmount()
  })
})

describe('markdown editor', () => {
  // mounted with a v-model, as in the renderers: the value follows the emitted edits
  function mountEditor(props: Record<string, unknown>, slots: Record<string, any> = {}) {
    const wrapper: any = mount(QMarkdownEditor as any, {
      props: { ...props, 'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }) },
      slots,
      global: { plugins: [Quasar, createTestI18n()] },
      attachTo: document.body,
    })
    return wrapper
  }

  const textareaOf = (wrapper: any) => wrapper.find('textarea').element as HTMLTextAreaElement
  const actionButtons = (wrapper: any) => wrapper.findAll('.q-markdown-editor__toolbar .q-btn')
  const lastEmitted = (wrapper: any) => {
    const emitted = wrapper.emitted('update:modelValue')!
    return emitted[emitted.length - 1]![0] as string
  }

  it('translates the toolbar titles with the built-in messages', async () => {
    const wrapper = mountEditor({ modelValue: '' })
    await flush()
    const titles = actionButtons(wrapper).map((b: any) => b.attributes('title'))
    expect(titles).toEqual(['Bold', 'Italic', 'Heading', 'List', 'Link', 'Preview'])
    wrapper.unmount()
  })

  it('wraps the selection in bold and italic markers', async () => {
    const wrapper = mountEditor({ modelValue: 'hello world' })
    await flush()
    textareaOf(wrapper).setSelectionRange(0, 5)
    await actionButtons(wrapper)[0]!.trigger('click')
    expect(lastEmitted(wrapper)).toBe('**hello** world')
    await flush()
    textareaOf(wrapper).setSelectionRange(10, 15)
    await actionButtons(wrapper)[1]!.trigger('click')
    expect(lastEmitted(wrapper)).toBe('**hello** _world_')
    wrapper.unmount()
  })

  it('inserts a placeholder and selects it when nothing is selected', async () => {
    const wrapper = mountEditor({ modelValue: 'hello' })
    await flush()
    textareaOf(wrapper).setSelectionRange(5, 5)
    await actionButtons(wrapper)[0]!.trigger('click')
    expect(lastEmitted(wrapper)).toBe('hello**text**')
    await flush()
    const el = textareaOf(wrapper)
    expect([el.selectionStart, el.selectionEnd]).toEqual([7, 11])
    wrapper.unmount()
  })

  it('prefixes the selected lines for headings and lists', async () => {
    const wrapper = mountEditor({ modelValue: 'one\ntwo' })
    await flush()
    textareaOf(wrapper).setSelectionRange(0, 7)
    await actionButtons(wrapper)[3]!.trigger('click')
    expect(lastEmitted(wrapper)).toBe('- one\n- two')
    await wrapper.setProps({ modelValue: '' })
    await flush()
    textareaOf(wrapper).setSelectionRange(0, 0)
    await actionButtons(wrapper)[2]!.trigger('click')
    expect(lastEmitted(wrapper)).toBe('## text')
    wrapper.unmount()
  })

  it('inserts a link and selects its url', async () => {
    const wrapper = mountEditor({ modelValue: 'see docs' })
    await flush()
    textareaOf(wrapper).setSelectionRange(4, 8)
    await actionButtons(wrapper)[4]!.trigger('click')
    expect(lastEmitted(wrapper)).toBe('see [docs](url)')
    await flush()
    const el = textareaOf(wrapper)
    expect(el.value.slice(el.selectionStart, el.selectionEnd)).toBe('url')
    wrapper.unmount()
  })

  it('edits without a textarea selection API by appending at the end', async () => {
    const wrapper = mountEditor({ modelValue: undefined })
    await flush()
    await actionButtons(wrapper)[4]!.trigger('click')
    expect(lastEmitted(wrapper)).toBe('[text](url)')
    wrapper.unmount()
  })

  it('toggles the preview, disabling the formatting actions', async () => {
    const wrapper = mountEditor({ modelValue: '# Title', label: 'Body', hint: 'help' })
    await flush()
    const toggle = wrapper.find('.q-markdown-editor__preview-toggle')
    expect(toggle.attributes('title')).toBe('Preview')
    await toggle.trigger('click')
    await flush()
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.find('.q-markdown-editor__preview').html()).toContain('<h1>Title</h1>')
    expect(wrapper.text()).toContain('Body')
    expect(wrapper.text()).toContain('help')
    expect(wrapper.find('.q-markdown-editor__preview-toggle').attributes('title')).toBe('Edit')
    const actions = actionButtons(wrapper).slice(0, 5)
    expect(actions.every((b: any) => b.classes().includes('disabled'))).toBe(true)
    await wrapper.find('.q-markdown-editor__preview-toggle').trigger('click')
    await flush()
    expect(wrapper.find('textarea').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows the error instead of the hint in preview', async () => {
    const wrapper = mountEditor({ modelValue: 'x', hint: 'help', error: true, errorMessage: 'bad' })
    await flush()
    await wrapper.find('.q-markdown-editor__preview-toggle').trigger('click')
    await flush()
    expect(wrapper.find('.text-negative').text()).toBe('bad')
    expect(wrapper.text()).not.toContain('help')
    wrapper.unmount()
  })

  it('renders the toolbar slot, also read-only', async () => {
    const wrapper = mountEditor({ modelValue: 'x' }, { toolbar: '<span class="extra">extra</span>' })
    await flush()
    expect(wrapper.find('.q-markdown-editor__toolbar .extra').exists()).toBe(true)
    await wrapper.setProps({ readonly: true })
    await flush()
    expect(wrapper.find('.q-markdown-editor--readonly .q-markdown-editor__toolbar .extra').exists()).toBe(true)
    wrapper.unmount()
  })

  it('has no toolbar read-only without a label or slot, and no preview text without a value', async () => {
    const wrapper = mountEditor({ modelValue: undefined, readonly: true })
    await flush()
    expect(wrapper.find('.q-markdown-editor__toolbar').exists()).toBe(false)
    expect(wrapper.find('.q-markdown-editor__preview').html()).not.toContain('<p>')
    wrapper.unmount()
  })
})
