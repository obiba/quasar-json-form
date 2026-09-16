import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'
import { normalizeDateMask } from '../src/components/QDateRenderer'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const lastErrors = (wrapper: any) => {
  const emitted = wrapper.emitted('update:errors')!
  return emitted[emitted.length - 1]![0] as any[]
}

const control = (scope: string, options: Record<string, unknown>) => ({
  type: 'VerticalLayout',
  elements: [{ type: 'Control', scope, options }],
})

describe('date renderer', () => {
  it('normalizes angular-strap masks', () => {
    expect(normalizeDateMask('yyyy-MM-dd')).toBe('YYYY-MM-DD')
    expect(normalizeDateMask('dd/MM/yyyy')).toBe('DD/MM/YYYY')
    expect(normalizeDateMask(undefined)).toBeUndefined()
  })

  it('validates the value against the dateFormat option', async () => {
    const schema = { type: 'object', properties: { d: { type: 'string', format: 'datepicker', title: 'D' } } }
    let wrapper = mountForm({ schema, uischema: control('#/properties/d', { dateOptions: { dateFormat: 'dd/MM/yyyy' } }), modelValue: { d: '15/01/2020' } })
    await flush()
    expect(wrapper.find('.q-field').classes()).not.toContain('q-field--error')
    wrapper.unmount()

    wrapper = mountForm({ schema, uischema: control('#/properties/d', { dateFormat: 'DD/MM/YYYY' }), modelValue: { d: '2020-01-15' } })
    await flush()
    expect(wrapper.find('.q-field').classes()).toContain('q-field--error')
    expect(wrapper.find('.q-field__messages').text()).toBe('Must be a valid date (DD/MM/YYYY)')
    expect(lastErrors(wrapper).map((e) => e.keyword)).toEqual(['date'])
    wrapper.unmount()
  })

  it('validates min and max bounds', async () => {
    const schema = { type: 'object', properties: { d: { type: 'string', format: 'date', title: 'D' } } }
    let wrapper = mountForm({ schema, uischema: control('#/properties/d', { min: '2020-01-01', max: '2020-12-31' }), modelValue: { d: '2021-01-01' } })
    await flush()
    expect(wrapper.find('.q-field__messages').text()).toBe('Must be between 2020-01-01 and 2020-12-31')
    wrapper.unmount()

    wrapper = mountForm({ schema, uischema: control('#/properties/d', { min: '2020-01-01' }), modelValue: { d: '2019-06-01' } })
    await flush()
    expect(wrapper.find('.q-field__messages').text()).toBe('Must be on or after 2020-01-01')
    wrapper.unmount()

    wrapper = mountForm({ schema, uischema: control('#/properties/d', { min: '2020-01-01', max: '2020-12-31' }), modelValue: { d: '2020-06-15' } })
    await flush()
    expect(wrapper.find('.q-field').classes()).not.toContain('q-field--error')
    wrapper.unmount()
  })

  it('renders a year-month picker with a YYYY-MM value', async () => {
    const schema = { type: 'object', properties: { ym: { type: 'string', format: 'year-month', title: 'YM' } } }
    const wrapper = mountForm({ schema, modelValue: { ym: '2020-02' } })
    await flush()
    expect(wrapper.find('.q-field').classes()).not.toContain('q-field--error')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('2020-02')
    wrapper.unmount()
  })

  describe('ymdatepicker (year / month references)', () => {
    const schema = {
      type: 'object',
      properties: {
        y: { type: 'number', title: 'Year' },
        m: { type: 'number', title: 'Month' },
        day: { type: 'string', format: 'ymdatepicker', title: 'Day' },
      },
    }
    const uischema = (extra: Record<string, unknown> = {}) => ({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/y' },
        { type: 'Control', scope: '#/properties/m' },
        { type: 'Control', scope: '#/properties/day', options: { dateOptions: { dateFormat: 'yyyy-MM-dd', yearRef: 'y', monthRef: 'm', ...extra } } },
      ],
    })

    it('is disabled until the year and month are set', async () => {
      const wrapper = mountForm({ schema, uischema: uischema(), modelValue: {} })
      await flush()
      expect(wrapper.findAll('.q-field')[2]!.classes()).toContain('q-field--disabled')
      expect(lastData(wrapper).day).toBeUndefined()
      wrapper.unmount()
    })

    it('defaults to the first day of the month', async () => {
      const wrapper = mountForm({ schema, uischema: uischema(), modelValue: { y: 2020, m: 2 } })
      await flush()
      expect(lastData(wrapper).day).toBe('2020-02-01')
      expect(wrapper.findAll('.q-field')[2]!.classes()).not.toContain('q-field--disabled')
      wrapper.unmount()
    })

    it('defaults to the last day of the month with lastDay', async () => {
      const wrapper = mountForm({ schema, uischema: uischema({ lastDay: true }), modelValue: { y: 2020, m: 2 } })
      await flush()
      expect(lastData(wrapper).day).toBe('2020-02-29')
      wrapper.unmount()
    })

    it('keeps an existing value and flags one outside the month', async () => {
      let wrapper = mountForm({ schema, uischema: uischema(), modelValue: { y: 2020, m: 2, day: '2020-02-10' } })
      await flush()
      expect(lastData(wrapper).day).toBe('2020-02-10')
      expect(wrapper.findAll('.q-field')[2]!.classes()).not.toContain('q-field--error')
      wrapper.unmount()

      wrapper = mountForm({
        schema,
        uischema: uischema({ validationMessage: { invalidYMDate: 'bad-day' } }),
        modelValue: { y: 2020, m: 2, day: '2020-03-05' },
      })
      await flush()
      expect(wrapper.findAll('.q-field')[2]!.find('.q-field__messages').text()).toBe('bad-day')
      wrapper.unmount()
    })

    it('follows the month when it changes', async () => {
      const wrapper = mountForm({ schema, uischema: uischema(), modelValue: { y: 2020, m: 2, day: '2020-02-10' } })
      await flush()
      await wrapper.setProps({ modelValue: { y: 2020, m: 3, day: '2020-02-10' } })
      await flush()
      expect(lastData(wrapper).day).toBe('2020-03-01')
      wrapper.unmount()
    })

    it('does not touch the value read-only', async () => {
      const wrapper = mountForm({ schema, uischema: uischema(), readonly: true, modelValue: { y: 2020, m: 2 } })
      await flush()
      expect(lastData(wrapper).day).toBeUndefined()
      wrapper.unmount()
    })
  })
})

describe('invalid date message', () => {
  it('uses validationMessage.dateInvalid, then a string validationMessage', async () => {
    const schema = { type: 'object', properties: { d: { type: 'string', format: 'datepicker', title: 'Date' } } }
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/d', options: { validationMessage: { dateInvalid: 'Not a date' } } },
      modelValue: { d: 'nope' },
    })
    await flush()
    expect(wrapper.text()).toContain('Not a date')
    wrapper.unmount()
    const wrapper2 = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/d', options: { validationMessage: 'Date error' } },
      modelValue: { d: 'nope' },
    })
    await flush()
    expect(wrapper2.text()).toContain('Date error')
    wrapper2.unmount()
  })
})
