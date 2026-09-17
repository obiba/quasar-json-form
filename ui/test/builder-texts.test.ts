/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { fromDefinition, toDefinition, descendants, addNode, textSlots, rawText, getText, setText, textKey, keyPrefix, isKnownKey, usedKeys, missingTranslations, pruneTranslations } from '../src/builder'
import type { FormDefinition, FormModel, FormNode, TextSlot } from '../src/builder'

const form: FormDefinition = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'name.title', description: 'Literal description' },
      color: { type: 'string', oneOf: [{ const: 'r', title: 'color.options.r' }, { const: 'b', title: 'Blue' }, { title: 'no const' }] },
      tags: { type: 'array', uniqueItems: true, items: { type: 'string', oneOf: [{ const: 'x', title: 'X' }] } },
      contacts: { type: 'array', items: { type: 'object', properties: { phone: { type: 'string' } } } },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/name', hint: 'name.hint', rules: { validation: [{ expr: 'length(name) > 1', message: 'name.validation.0' }] } },
      { type: 'Control', scope: '#/properties/color', label: false },
      { type: 'Control', scope: '#/properties/tags' },
      { type: 'Control', scope: '#/properties/contacts', options: { items: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/phone' }] } } },
      { type: 'Group', label: 'group.1.label', elements: [{ type: 'Label', text: 'Plain text' }, { type: 'Section', label: 'section.1.label', description: 'section.1.description' }] },
      { type: 'TabsLayout', labels: ['tabs.1.labels.0'], elements: [{ type: 'VerticalLayout', elements: [] }, { type: 'VerticalLayout', elements: [] }] },
    ],
  },
  translations: {
    en: { 'name.title': 'Name', 'name.hint': 'Hint', 'name.validation.0': 'Too short', 'name.error.required': 'Required', 'color.options.r': 'Red', 'group.1.label': 'Group', 'section.1.label': 'Section', 'tabs.1.labels.0': 'First', 'orphan.title': 'Orphan' },
    fr: { 'name.title': 'Nom', 'color.options.r': 'Rouge' },
  },
}

const node = (model: FormModel, match: (n: FormNode) => boolean) => descendants(model.root).find(match)!
const control = (model: FormModel, key: string) => node(model, (n) => n.path?.join('.') === key)
const slot = (model: FormModel, n: FormNode, name: string): TextSlot => textSlots(model, n).find((s) => s.name === name)!
const names = (model: FormModel, n: FormNode) => textSlots(model, n).map((s) => s.name)

describe('textSlots', () => {
  const model = fromDefinition(form)

  it('lists the texts of a control: title, description, label, hint, options and messages', () => {
    expect(names(model, control(model, 'name'))).toEqual(['title', 'description', 'label', 'hint', 'validation.0'])
    expect(slot(model, control(model, 'name'), 'title')).toEqual({ name: 'title', target: 'schema', path: ['title'] })
    expect(slot(model, control(model, 'name'), 'validation.0').path).toEqual(['rules', 'validation', 0, 'message'])
    // `label: false` has no label; options come from `oneOf`, the entries with a `const`
    expect(names(model, control(model, 'color'))).toEqual(['title', 'description', 'hint', 'options.r', 'options.b'])
    expect(slot(model, control(model, 'color'), 'options.b').path).toEqual(['oneOf', 1, 'title'])
    expect(slot(model, control(model, 'tags'), 'options.x').path).toEqual(['items', 'oneOf', 0, 'title'])
  })

  it('lists the texts of layouts and elements', () => {
    expect(names(model, model.root)).toEqual([])
    expect(names(model, node(model, (n) => n.element.type === 'Group'))).toEqual(['label'])
    expect(names(model, node(model, (n) => n.element.type === 'Label'))).toEqual(['text'])
    expect(names(model, node(model, (n) => n.element.type === 'Section'))).toEqual(['label', 'description'])
    expect(names(model, node(model, (n) => n.element.type === 'TabsLayout'))).toEqual(['labels.0', 'labels.1'])
    expect(slot(model, node(model, (n) => n.element.type === 'TabsLayout'), 'labels.1').path).toEqual(['labels', 1])
  })
})

describe('getText', () => {
  const model = fromDefinition(form)

  it('returns the translation, the literal, or undefined', () => {
    const name = control(model, 'name')
    expect(rawText(model, name, slot(model, name, 'title'))).toBe('name.title')
    expect(getText(model, name, slot(model, name, 'title'), 'en')).toBe('Name')
    expect(getText(model, name, slot(model, name, 'title'), 'fr')).toBe('Nom')
    // a key of the form, not translated in that language
    expect(getText(model, name, slot(model, name, 'hint'), 'fr')).toBeUndefined()
    // a literal
    expect(getText(model, name, slot(model, name, 'description'), 'fr')).toBe('Literal description')
    expect(getText(model, control(model, 'color'), slot(model, control(model, 'color'), 'options.b'), 'en')).toBe('Blue')
    // an empty slot
    expect(getText(model, name, slot(model, name, 'label'), 'en')).toBeUndefined()
    expect(isKnownKey(model, 'name.hint')).toBe(true)
    expect(isKnownKey(model, 'Blue')).toBe(false)
  })
})

describe('keys', () => {
  it('derives the prefix of a control from its path, under the items of its lists', () => {
    const model = fromDefinition(form)
    expect(keyPrefix(model, control(model, 'name'))).toBe('name')
    expect(keyPrefix(model, control(model, 'phone'))).toBe('contacts.items.phone')
    expect(textKey(model, control(model, 'phone'), slot(model, control(model, 'phone'), 'title'))).toBe('contacts.items.phone.title')
    // an existing key is kept, a literal is replaced
    expect(textKey(model, control(model, 'name'), slot(model, control(model, 'name'), 'title'))).toBe('name.title')
    expect(textKey(model, control(model, 'name'), slot(model, control(model, 'name'), 'description'))).toBe('name.description')
    expect(textKey(model, control(model, 'color'), slot(model, control(model, 'color'), 'options.b'))).toBe('color.options.b')
  })

  it('reads the prefix of a layout from its keys, or makes a new one', () => {
    const model = fromDefinition(form)
    expect(keyPrefix(model, node(model, (n) => n.element.type === 'Group'))).toBe('group.1')
    expect(keyPrefix(model, node(model, (n) => n.element.type === 'TabsLayout'))).toBe('tabs.1')
    expect(keyPrefix(model, node(model, (n) => n.element.type === 'Label'))).toBe('label.1')
    const group2 = addNode(model, model.root.id, { uischema: { type: 'Group', label: '', elements: [] } })!
    expect(keyPrefix(model, group2)).toBe('group.2')
    const stepper = addNode(model, model.root.id, { uischema: { type: 'StepperLayout', elements: [] } })!
    expect(keyPrefix(model, stepper)).toBe('stepper.1')
    const vertical = addNode(model, model.root.id, { uischema: { type: 'VerticalLayout', label: '', elements: [] } })!
    expect(keyPrefix(model, vertical)).toBe('vertical.1')
  })
})

describe('setText', () => {
  it('stores the key in the slot and the text in the translations', () => {
    const model = fromDefinition(form)
    const name = control(model, 'name')
    expect(setText(model, name, slot(model, name, 'label'), 'en', 'Your name')).toBe('name.label')
    expect(name.element.label).toBe('name.label')
    expect(model.translations.en!['name.label']).toBe('Your name')
    setText(model, name, slot(model, name, 'label'), 'fr', 'Votre nom')
    expect(getText(model, name, slot(model, name, 'label'), 'fr')).toBe('Votre nom')
    // a literal becomes a key, its text is replaced by the given one
    setText(model, name, slot(model, name, 'description'), 'en', 'Described')
    expect(model.schema.properties.name.description).toBe('name.description')
    expect(model.translations.en!['name.description']).toBe('Described')
    // an option label, a message
    const color = control(model, 'color')
    setText(model, color, slot(model, color, 'options.b'), 'fr', 'Bleu')
    expect(model.schema.properties.color.oneOf[1].title).toBe('color.options.b')
    expect(model.translations.fr!['color.options.b']).toBe('Bleu')
    setText(model, name, slot(model, name, 'validation.0'), 'fr', 'Trop court')
    expect(model.translations.fr!['name.validation.0']).toBe('Trop court')
    // a new language
    setText(model, name, slot(model, name, 'title'), 'de', 'Name')
    expect(model.translations.de).toEqual({ 'name.title': 'Name' })
  })

  it('creates the intermediate objects and arrays, and removes a translation on empty text', () => {
    const model = fromDefinition(form)
    const tabs = node(model, (n) => n.element.type === 'TabsLayout')
    setText(model, tabs, slot(model, tabs, 'labels.1'), 'en', 'Second')
    expect(tabs.element.labels).toEqual(['tabs.1.labels.0', 'tabs.1.labels.1'])
    const label = node(model, (n) => n.element.type === 'Label')
    setText(model, label, slot(model, label, 'text'), 'en', 'Hello')
    expect(label.element.text).toBe('label.1.text')
    setText(model, label, slot(model, label, 'text'), 'en', '')
    expect(label.element.text).toBe('label.1.text')
    expect(model.translations.en!['label.1.text']).toBeUndefined()
    const phone = control(model, 'phone')
    setText(model, phone, slot(model, phone, 'hint'), 'en', 'Digits')
    expect(toDefinition(model).uischema.elements[3].options.items.elements[0].hint).toBe('contacts.items.phone.hint')
  })
})

describe('translations', () => {
  it('lists the keys in use and the missing translations', () => {
    const model = fromDefinition(form)
    expect(usedKeys(model).sort()).toEqual(['color.options.r', 'group.1.label', 'name.hint', 'name.title', 'name.validation.0', 'section.1.label', 'tabs.1.labels.0'])
    expect(missingTranslations(model, 'fr')).toEqual(['group.1.label', 'name.error.required', 'name.hint', 'name.validation.0', 'orphan.title', 'section.1.label', 'tabs.1.labels.0'])
    expect(missingTranslations(model, 'en')).toEqual([])
    expect(missingTranslations(model, 'de').length).toBe(9)
  })

  it('prunes the translations of removed nodes, keeping the renderer keys of the nodes', () => {
    const model = fromDefinition(form)
    expect(pruneTranslations(model)).toEqual(['orphan.title'])
    expect(model.translations.en!['name.error.required']).toBe('Required')
    // `section.1.description` is a slot without translation: nothing to prune; a stray key under a node prefix stays
    model.translations.en!['section.1.anything'] = 'x'
    expect(pruneTranslations(model)).toEqual([])
  })
})
