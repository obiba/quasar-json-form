import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

const schema = { type: 'object', properties: { a: { type: 'string' } } }

function mountLabel(label: Record<string, unknown>, messages?: Record<string, unknown>) {
  return mountForm({ schema, uischema: { type: 'VerticalLayout', elements: [label] } }, { messages })
}

describe('Label renderer', () => {
  it('renders markdown from the JSON Forms `text` property', async () => {
    const wrapper = mountLabel({ type: 'Label', text: 'Some **bold** text' })
    await flush()
    expect(wrapper.find('.q-label-renderer').html()).toContain('<strong>bold</strong>')
    wrapper.unmount()
  })

  it('also accepts `label`', async () => {
    const wrapper = mountLabel({ type: 'Label', label: 'Plain' })
    await flush()
    expect(wrapper.find('.q-label-renderer').text()).toBe('Plain')
    wrapper.unmount()
  })

  it('resolves i18n keys', async () => {
    const wrapper = mountLabel({ type: 'Label', text: 'help.intro' }, { en: { help: { intro: 'Translated **intro**' } } })
    await flush()
    expect(wrapper.find('.q-label-renderer').html()).toContain('Translated <strong>intro</strong>')
    wrapper.unmount()
  })

  it('keeps raw HTML blocks such as headings and alert boxes', async () => {
    const html = '<h3>Section title</h3>\n<div class="alert alert-info"><p>Some <em>note</em></p></div>'
    const wrapper = mountLabel({ type: 'Label', text: html })
    await flush()
    const rendered = wrapper.find('.q-label-renderer').html()
    expect(rendered).toContain('<h3>Section title</h3>')
    expect(rendered).toContain('<div class="alert alert-info">')
    expect(rendered).toContain('<em>note</em>')
    wrapper.unmount()
  })

  it('sanitizes scripts and event handlers', async () => {
    const html = '<h3 onclick="alert(1)">Title</h3><script>alert(1)</script><a href="javascript:alert(1)">x</a>'
    const wrapper = mountLabel({ type: 'Label', text: html })
    await flush()
    const rendered = wrapper.find('.q-label-renderer').html()
    expect(rendered).toContain('<h3>Title</h3>')
    expect(rendered).not.toContain('<script')
    expect(rendered).not.toContain('onclick')
    expect(rendered).not.toContain('javascript:')
    wrapper.unmount()
  })
})
