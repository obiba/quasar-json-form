import { describe, it, expect } from 'vitest'
import { QDate, QTime } from 'quasar'
import { mountForm, flush } from './utils'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const lastErrors = (wrapper: any) => {
  const emitted = wrapper.emitted('update:errors')!
  return emitted[emitted.length - 1]![0] as any[]
}

const openPopup = async (wrapper: any, index = 0) => {
  await wrapper.findAll('.q-field__append .q-icon.cursor-pointer')[index]!.trigger('click')
  await flush()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await flush()
}

const closeMenus = () => {
  document.body.querySelectorAll('.q-menu, .q-dialog').forEach((el) => el.remove())
}

describe('time renderer', () => {
  const schema = {
    type: 'object',
    properties: {
      t: { type: 'string', format: 'time', title: 'Time', description: 'When' },
      full: { type: 'string', format: 'fulltime', title: 'Full' },
      show: { type: 'boolean' },
    },
  }

  it('renders an input with a time mask, the title and the description', async () => {
    const wrapper = mountForm({ schema, modelValue: { t: '10:30', full: '10:30:15' } })
    await flush()
    const fields = wrapper.findAll('.q-field')
    expect(fields[0]!.element.parentElement!.querySelector('.q-form-title')!.textContent).toBe('Time')
    expect((fields[0]!.find('input').element as HTMLInputElement).value).toBe('10:30')
    expect(fields[0]!.element.parentElement!.querySelector('.q-form-description')!.textContent).toBe('When')
    expect((fields[1]!.find('input').element as HTMLInputElement).value).toBe('10:30:15')
    wrapper.unmount()
  })

  it('updates the data from the input and drops an emptied value', async () => {
    const wrapper = mountForm({ schema, modelValue: { t: '10:30' } })
    await flush()
    const input = wrapper.find('input')
    await input.setValue('1145')
    await flush()
    expect(lastData(wrapper).t).toBe('11:45')
    await input.setValue('')
    await flush()
    expect(lastData(wrapper).t).toBeUndefined()
    wrapper.unmount()
  })

  it('opens a time picker with seconds for fulltime', async () => {
    const wrapper = mountForm({ schema, modelValue: { full: '10:30:15' } })
    await flush()
    await openPopup(wrapper, 1)
    const picker = wrapper.findComponent(QTime)
    expect(picker.exists()).toBe(true)
    expect(picker.props('withSeconds')).toBe(true)
    expect(picker.props('format24h')).toBe(true)
    picker.vm.$emit('update:modelValue', '12:00:00')
    await flush()
    expect(lastData(wrapper).full).toBe('12:00:00')
    await picker.find('.q-btn').trigger('click')
    await flush()
    wrapper.unmount()
    closeMenus()
  })

  it('hides the picker read-only and clears the value when hidden', async () => {
    const readonly = mountForm({ schema, modelValue: { t: '10:30' }, readonly: true })
    await flush()
    expect(readonly.find('.q-field__append .q-icon.cursor-pointer').exists()).toBe(false)
    expect(readonly.find('.q-field').classes()).toContain('q-field--readonly')
    readonly.unmount()

    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/t', rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { show: true, t: '10:30' },
    })
    await flush()
    expect(wrapper.findAll('.q-field').length).toBe(1)
    await wrapper.setProps({ modelValue: { show: false, t: '10:30' } })
    await flush()
    expect(wrapper.findAll('.q-field').length).toBe(0)
    expect(lastData(wrapper).t).toBeUndefined()
    wrapper.unmount()
  })

  it('validates the picker value without seconds or timezone', async () => {
    let wrapper = mountForm({ schema, modelValue: { t: '10:30', full: '23:59:59' } })
    await flush()
    expect(wrapper.findAll('.q-field').every((f) => !f.classes().includes('q-field--error'))).toBe(true)
    expect(lastErrors(wrapper)).toEqual([])
    wrapper.unmount()

    wrapper = mountForm({ schema, modelValue: { t: '24:30' } })
    await flush()
    expect(wrapper.find('.q-field').classes()).toContain('q-field--error')
    expect(wrapper.find('.q-field__messages').text()).toBe('Must be a valid time')
    expect(lastErrors(wrapper).map((e) => e.keyword)).toEqual(['format'])
    wrapper.unmount()
  })

  it('is disabled by an enabled rule', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/t', rules: { enabled: 'truthy(show)' } },
      modelValue: { show: false },
    })
    await flush()
    expect(wrapper.find('.q-field').classes()).toContain('q-field--disabled')
    wrapper.unmount()
  })
})

describe('date-time renderer', () => {
  const schema = {
    type: 'object',
    properties: {
      dt: { type: 'string', format: 'date-time', title: 'When', description: 'Date and time' },
      full: { type: 'string', format: 'date-fulltime', title: 'Full' },
      show: { type: 'boolean' },
    },
  }

  it('renders the value, the title and the description, and updates the data', async () => {
    const wrapper = mountForm({ schema, modelValue: { dt: '2020-01-15 10:30' } })
    await flush()
    const field = wrapper.find('.q-field')
    expect(field.element.parentElement!.querySelector('.q-form-title')!.textContent).toBe('When')
    expect(field.element.parentElement!.querySelector('.q-form-description')!.textContent).toBe('Date and time')
    const input = field.find('input')
    expect((input.element as HTMLInputElement).value).toBe('2020-01-15 10:30')
    await input.setValue('2021-02-03 04:05')
    await flush()
    expect(lastData(wrapper).dt).toBe('2021-02-03 04:05')
    await input.setValue('')
    await flush()
    expect(lastData(wrapper).dt).toBeUndefined()
    wrapper.unmount()
  })

  it('validates the picker value without seconds or timezone', async () => {
    let wrapper = mountForm({ schema, modelValue: { dt: '2020-01-15 10:30' } })
    await flush()
    expect(wrapper.find('.q-field').classes()).not.toContain('q-field--error')
    expect(lastErrors(wrapper)).toEqual([])
    wrapper.unmount()

    wrapper = mountForm({ schema, modelValue: { dt: '2020-02-30 10:30' } })
    await flush()
    expect(wrapper.find('.q-field__messages').text()).toBe('Must be a valid date-time')
    expect(lastErrors(wrapper).map((e) => e.keyword)).toEqual(['format'])
    wrapper.unmount()
  })

  it('opens the date and the time pickers with the mask of the format', async () => {
    const wrapper = mountForm({ schema, modelValue: { dt: '2020-01-15 10:30', full: '2020-01-15 10:30:00' } })
    await flush()
    // the first control has two icons: date, then time
    await openPopup(wrapper, 0)
    const date = wrapper.findComponent(QDate)
    expect(date.exists()).toBe(true)
    expect(date.props('mask')).toBe('YYYY-MM-DD HH:mm')
    date.vm.$emit('update:modelValue', '2020-02-20 10:30')
    await flush()
    expect(lastData(wrapper).dt).toBe('2020-02-20 10:30')
    await date.find('.q-btn').trigger('click')
    await flush()
    closeMenus()

    await openPopup(wrapper, 1)
    const time = wrapper.findComponent(QTime)
    expect(time.exists()).toBe(true)
    expect(time.props('withSeconds')).toBe(false)
    await time.find('.q-btn').trigger('click')
    await flush()
    closeMenus()

    // fulltime: seconds
    await openPopup(wrapper, 3)
    const fullTime = wrapper.findComponent(QTime)
    expect(fullTime.props('mask')).toBe('YYYY-MM-DD HH:mm:ss')
    expect(fullTime.props('withSeconds')).toBe(true)
    wrapper.unmount()
    closeMenus()
  })

  it('hides the pickers read-only and clears the value when hidden', async () => {
    const readonly = mountForm({ schema, modelValue: { dt: '2020-01-15 10:30' }, readonly: true })
    await flush()
    expect(readonly.find('.q-field__append .q-icon.cursor-pointer').exists()).toBe(false)
    readonly.unmount()

    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/dt', rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { show: true, dt: '2020-01-15 10:30' },
    })
    await flush()
    await wrapper.setProps({ modelValue: { show: false, dt: '2020-01-15 10:30' } })
    await flush()
    expect(wrapper.findAll('.q-field').length).toBe(0)
    expect(lastData(wrapper).dt).toBeUndefined()
    wrapper.unmount()
  })
})

describe('date picker popup', () => {
  it('opens a QDate bounded by min and max and closes with the button', async () => {
    const schema = { type: 'object', properties: { d: { type: 'string', format: 'date', title: 'D' } } }
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/d', options: { min: '2020-01-10', max: '2020-03-20' } },
      modelValue: { d: '2020-02-15' },
    })
    await flush()
    await openPopup(wrapper, 0)
    const date = wrapper.findComponent(QDate)
    expect(date.exists()).toBe(true)
    expect(date.props('navigationMinYearMonth')).toBe('2020/01')
    expect(date.props('navigationMaxYearMonth')).toBe('2020/03')
    const selectable = date.props('options') as (d: string) => boolean
    expect(selectable('2020/02/01')).toBe(true)
    expect(selectable('2020/01/09')).toBe(false)
    expect(selectable('2020/03/21')).toBe(false)
    date.vm.$emit('update:modelValue', '2020-02-20')
    await flush()
    expect(lastData(wrapper).d).toBe('2020-02-20')
    await date.find('.q-btn').trigger('click')
    await flush()
    wrapper.unmount()
    closeMenus()
  })

  it('opens a month view for year-month controls without bounds', async () => {
    const schema = { type: 'object', properties: { ym: { type: 'string', format: 'year-month', title: 'YM' } } }
    const wrapper = mountForm({ schema, modelValue: { ym: '2020-02' } })
    await flush()
    await openPopup(wrapper, 0)
    const date = wrapper.findComponent(QDate)
    expect(date.props('defaultView')).toBe('Months')
    expect(date.props('emitImmediately')).toBe(true)
    expect(date.props('options')).toBeUndefined()
    wrapper.unmount()
    closeMenus()
  })
})
