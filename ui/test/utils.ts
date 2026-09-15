/* eslint-disable @typescript-eslint/no-explicit-any */
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'
import QJsonForm from '../src/components/QJsonForm'

export function createTestI18n(messages: Record<string, any> = {}, locale = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    missingWarn: false,
    fallbackWarn: false,
    warnHtmlMessage: false,
    messages: { en: {}, fr: {}, ...messages },
  })
}

export interface MountFormOptions {
  messages?: Record<string, any>
  locale?: string
  provide?: Record<string, any>
}

export function mountForm(props: Record<string, any>, options: MountFormOptions = {}) {
  return mount(QJsonForm as any, {
    props,
    global: {
      plugins: [Quasar, createTestI18n(options.messages, options.locale)],
      provide: options.provide,
    },
    attachTo: document.body,
  })
}

export async function flush(times = 3) {
  for (let i = 0; i < times; i++) {
    await nextTick()
  }
}
