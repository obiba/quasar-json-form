import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'
import { ruleEngine } from '../src/composables/useRules'
import { countWords, parseWordLimit } from '../src/utils/words'

const schema = {
  type: 'object',
  properties: {
    abstract: { type: 'string', title: 'Abstract' },
  },
}

const control = (options: Record<string, unknown>) => ({
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope: '#/properties/abstract', options }],
})

const lastErrors = (wrapper: any) => {
  const emitted = wrapper.emitted('update:errors')!
  return emitted[emitted.length - 1]![0] as any[]
}

describe('word count', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('one two  three\nfour')).toBe(4)
    expect(countWords('')).toBe(0)
    expect(countWords(undefined)).toBe(0)
  })

  it('parses the word limit options', () => {
    expect(parseWordLimit({ wordLimit: '0:500' })).toEqual({ min: 0, max: 500, source: 'wordLimit' })
    expect(parseWordLimit({ wordLimit: 200 })).toEqual({ min: 0, max: 200, source: 'wordLimit' })
    expect(parseWordLimit({ wordMax: 10 })).toEqual({ min: undefined, max: 10, source: 'wordMax' })
    expect(parseWordLimit({ wordMin: '2' })).toEqual({ min: 2, max: undefined, source: 'wordMin' })
    expect(parseWordLimit({})).toBeUndefined()
  })

  it('is available to rules', () => {
    expect(ruleEngine.evaluate('wordCount(text) <= 3', { text: 'a b c d' })).toBe(false)
    expect(ruleEngine.evaluate('wordCount(text) <= 3', { text: 'a b' })).toBe(true)
    expect(ruleEngine.evaluate('contains(list, "x")', { list: ['x', 'y'] })).toBe(true)
    expect(ruleEngine.evaluate('contains(list, "z")', { list: ['x', 'y'] })).toBe(false)
    expect(ruleEngine.evaluate('contains(list, "z")', {})).toBe(false)
  })
})

describe('string word limit', () => {
  it('flags a text over the wordLimit and shows a word counter', async () => {
    const wrapper = mountForm({ schema, uischema: control({ wordLimit: '0:3', rows: 2 }), modelValue: { abstract: 'a b c d' } })
    await flush()
    const field = wrapper.find('.q-field')
    expect(field.classes()).toContain('q-field--error')
    expect(field.find('.q-field__messages').text()).toBe('Must have at most 3 words')
    expect(field.find('.q-field__counter').text()).toBe('4 / 3 words')
    expect(lastErrors(wrapper).map((e) => [e.keyword, e.instancePath])).toEqual([['wordLimit', '/abstract']])
    wrapper.unmount()
  })

  it('uses the wordLimitError validation message', async () => {
    const wrapper = mountForm({
      schema,
      uischema: control({ wordLimit: '0:3', validationMessage: { wordLimitError: 'too-long' } }),
      modelValue: { abstract: 'a b c d' },
    })
    await flush()
    expect(wrapper.find('.q-field__messages').text()).toBe('too-long')
    wrapper.unmount()
  })

  it('supports a range and a minimum', async () => {
    let wrapper = mountForm({ schema, uischema: control({ wordLimit: '2:5' }), modelValue: { abstract: 'a' } })
    await flush()
    expect(wrapper.find('.q-field__messages').text()).toBe('Must have between 2 and 5 words')
    wrapper.unmount()

    wrapper = mountForm({ schema, uischema: control({ wordMin: 2 }), modelValue: { abstract: 'a' } })
    await flush()
    expect(wrapper.find('.q-field__messages').text()).toBe('Must have at least 2 words')
    wrapper.unmount()

    wrapper = mountForm({ schema, uischema: control({ wordMax: 2 }), modelValue: { abstract: 'a b' } })
    await flush()
    expect(wrapper.find('.q-field').classes()).not.toContain('q-field--error')
    expect(wrapper.find('.q-field__counter').text()).toBe('2 / 2 words')
    wrapper.unmount()
  })
})
