import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { defineComponent, ref } from 'vue'
import QJsonForm from '../src/components/QJsonForm'
import { I18N_KEY } from '../src/composables/keys'
import { useFormI18n } from '../src/composables/useFormI18n'
import type { FormI18n } from '../src/composables/useFormI18n'
import { createTestI18n, mountForm, flush } from './utils'

// every text is a key, resolved by the translations embedded in the form
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'name.title', description: 'name.description', minLength: 2 },
    color: {
      type: 'string',
      title: 'color.title',
      oneOf: [{ const: 'r', title: 'color.red' }, { const: 'b', title: 'color.blue' }],
    },
  },
  required: ['name'],
}

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/name', hint: 'name.hint' },
    { type: 'Control', scope: '#/properties/color', options: { format: 'radio' } },
  ],
}

const translations = {
  en: {
    'name.title': 'Name',
    'name.description': 'Your name',
    'name.hint': 'As on your passport',
    'name.error.required': 'Please name yourself',
    color: { title: 'Color', red: 'Red', blue: 'Blue' },
  },
  fr: {
    'name.title': 'Nom',
    'name.description': 'Votre nom',
    color: { title: 'Couleur', red: 'Rouge' },
  },
}

// the hint is only translated by the application, and `color.blue` only in english
const partial = {
  en: { ...translations.en, 'name.hint': undefined },
  fr: translations.fr,
}

const title = (wrapper: any, index: number) => wrapper.findAll('.q-form-title')[index]!.text()
const radios = (wrapper: any) => wrapper.findAll('.q-radio__label').map((r: any) => r.text())

describe('form translations', () => {
  afterEach(() => vi.restoreAllMocks())

  it('translates the texts of the schema and UI schema, flat or nested keys', async () => {
    const wrapper = mountForm({ schema, uischema, translations, modelValue: { name: 'Ada' } })
    await flush()
    expect(title(wrapper, 0)).toBe('Name *')
    expect(wrapper.find('.q-form-description').text()).toBe('Your name')
    expect(wrapper.find('.q-form-hint').text()).toBe('As on your passport')
    expect(title(wrapper, 1)).toBe('Color')
    expect(radios(wrapper)).toEqual(['Red', 'Blue'])
    wrapper.unmount()
  })

  it('takes precedence over the application messages and translates the errors', async () => {
    const wrapper = mountForm(
      { schema, uischema, translations, modelValue: { name: 'x' } },
      { messages: { en: { name: { title: 'App name' }, error: { minLength: 'App min {limit}' } } } },
    )
    await flush()
    expect(title(wrapper, 0)).toBe('Name *')
    // the control specific message from the form, the keyword message from the application
    expect(wrapper.find('.q-field__messages').text()).toBe('App min 2')
    await wrapper.setProps({ modelValue: {} })
    await flush()
    expect(wrapper.find('.q-field__messages').text()).toBe('Please name yourself')
    wrapper.unmount()
  })

  it('renders in the form locale, falling back to the fallback locale, then the application, then the built-in messages', async () => {
    const wrapper = mountForm(
      { schema, uischema, translations: partial, locale: 'fr', modelValue: { name: 'Ada' } },
      { messages: { en: { name: { hint: 'App hint' } }, fr: { name: { hint: 'Indice' } } } },
    )
    await flush()
    // form translations in french
    expect(title(wrapper, 0)).toBe('Nom *')
    expect(title(wrapper, 1)).toBe('Couleur')
    // `color.blue` is missing in french: the english form translation
    expect(radios(wrapper)).toEqual(['Rouge', 'Blue'])
    // `name.hint` is not a form translation: the application messages, in french
    expect(wrapper.find('.q-form-hint').text()).toBe('Indice')
    // the built-in error message, in french
    await wrapper.setProps({ modelValue: { name: 'x' } })
    await flush()
    expect(wrapper.find('.q-field__messages').text()).toBe('Doit contenir au moins 2 caractères')
    wrapper.unmount()
  })

  it('answers te for the keys t resolves, the fallback locale included', () => {
    let i18n: FormI18n | undefined
    const Probe = defineComponent({
      setup() {
        i18n = useFormI18n(ref({ locale: 'fr', translations: { en: { 'color.blue': 'Blue' }, fr: { 'color.red': 'Rouge' } } }))
        return () => null
      },
    })
    const wrapper = mount(Probe, { global: { plugins: [createTestI18n({ en: { app: 'App' } })] } })
    expect(i18n!.t('color.red')).toBe('Rouge')
    expect(i18n!.te('color.red')).toBe(true)
    // only in the fallback locale: t finds it, so does te
    expect(i18n!.t('color.blue')).toBe('Blue')
    expect(i18n!.te('color.blue')).toBe(true)
    expect(i18n!.te('color.blue', 'fr')).toBe(false)
    expect(i18n!.te('color.blue', 'en')).toBe(true)
    // the application messages: vue-i18n answers for the form locale (its fallback is not consulted by `te`)
    expect(i18n!.te('app', 'en')).toBe(true)
    expect(i18n!.te('app')).toBe(false)
    expect(i18n!.te('nothing')).toBe(false)
    wrapper.unmount()
  })

  it('accepts regional locales', async () => {
    const wrapper = mountForm({ schema, uischema, translations, locale: 'fr-CA', modelValue: {} })
    await flush()
    expect(title(wrapper, 0)).toBe('Nom *')
    wrapper.unmount()
  })

  it('follows the changes of the translations and of the locale', async () => {
    const wrapper = mountForm({ schema, uischema, translations, modelValue: {} })
    await flush()
    expect(title(wrapper, 0)).toBe('Name *')
    await wrapper.setProps({ locale: 'fr' })
    await flush()
    expect(title(wrapper, 0)).toBe('Nom *')
    // the control specific message exists in the fallback locale of the form translations only
    expect(wrapper.find('.q-field__messages').text()).toBe('Please name yourself')
    await wrapper.setProps({ translations: { ...translations, fr: { ...translations.fr, 'name.title': 'Prénom' } } })
    await flush()
    expect(title(wrapper, 0)).toBe('Prénom *')
    wrapper.unmount()
  })

  it('leaves the keys as-is when they are not translated anywhere', async () => {
    const wrapper = mountForm({ schema, uischema, translations: { en: {} }, modelValue: {} })
    await flush()
    expect(title(wrapper, 0)).toBe('name.title *')
    wrapper.unmount()
  })

  it('inherits an application-level provide, overridden by the props', async () => {
    const provided = ref({ locale: 'fr', translations })
    const wrapper = mountForm({ schema, uischema, modelValue: {} }, { provide: { [I18N_KEY]: provided } })
    await flush()
    expect(title(wrapper, 0)).toBe('Nom *')
    await wrapper.setProps({ locale: 'en' })
    await flush()
    expect(title(wrapper, 0)).toBe('Name *')
    wrapper.unmount()
  })

  it('works without vue-i18n', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(QJsonForm as any, {
      props: { schema, uischema, translations, locale: 'fr', modelValue: {} },
      global: { plugins: [Quasar] },
      attachTo: document.body,
    })
    await flush()
    expect(title(wrapper, 0)).toBe('Nom *')
    // no fallback locale without vue-i18n: the key stays
    expect(radios(wrapper)).toEqual(['Rouge', 'color.blue'])
    expect(wrapper.find('.q-field__messages').text()).toContain('Ce champ est requis')
    wrapper.unmount()
  })
})
