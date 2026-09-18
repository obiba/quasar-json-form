import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'
import { collectHiddenPaths, errorDataPath, filterHiddenErrors } from '../src/utils/visibility'

const schema = {
  type: 'object',
  properties: {
    grant: { type: 'boolean' },
    agency: { type: 'string' },
    career: { type: 'string' },
    careerOther: { type: 'string', rules: { visible: 'career == "other"' } },
    name: { type: 'string', minLength: 3 },
  },
  required: ['agency', 'careerOther'],
}

// a section shown on `grant` holding a required control, a control with its own rule on the schema
const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/grant' },
    {
      type: 'VerticalLayout',
      rules: { visible: 'grant' },
      elements: [
        { type: 'Group', elements: [{ type: 'Control', scope: '#/properties/agency' }] },
      ],
    },
    { type: 'Control', scope: '#/properties/career' },
    { type: 'Control', scope: '#/properties/careerOther' },
    { type: 'Control', scope: '#/properties/name', rules: { visible: 'career != "student"' } },
  ],
}

const lastErrors = (wrapper: any) => {
  const emitted = wrapper.emitted('update:errors')!
  return emitted[emitted.length - 1]![0] as any[]
}
const keys = (errors: any[]) => errors.map((e) => `${e.keyword}:${errorDataPath(e)}`)

describe('hidden controls', () => {
  it('collects the data paths of the controls hidden by their rule or by an enclosing layout', () => {
    const truthy = (data: Record<string, any>) => (rule: string) => {
      if (rule === 'grant') return !!data.grant
      if (rule === 'career == "other"') return data.career === 'other'
      if (rule === 'career != "student"') return data.career !== 'student'
      return true
    }
    expect(collectHiddenPaths(uischema, schema, truthy({ grant: false, career: 'student' }))).toEqual(['/agency', '/careerOther', '/name'])
    expect(collectHiddenPaths(uischema, schema, truthy({ grant: true, career: 'other' }))).toEqual([])
  })

  it('filters the errors of a hidden control and of its descendants', () => {
    const errors: any[] = [
      { keyword: 'required', instancePath: '', params: { missingProperty: 'agency' } },
      { keyword: 'minLength', instancePath: '/name', params: {} },
      { keyword: 'required', instancePath: '/staff/0', params: { missingProperty: 'email' } },
      { keyword: 'type', instancePath: '/staffing', params: {} },
    ]
    expect(keys(filterHiddenErrors(errors, ['/agency', '/staff']))).toEqual(['minLength:/name', 'type:/staffing'])
    expect(filterHiddenErrors(errors, [])).toBe(errors)
  })

  it('does not emit the AJV errors of hidden controls', async () => {
    const wrapper = mountForm({ schema, uischema, modelValue: { grant: false, career: 'student', name: 'x' } })
    await flush()
    // agency (hidden section), careerOther (own schema rule) and name (own uischema rule) are all hidden
    expect(lastErrors(wrapper)).toEqual([])

    await wrapper.setProps({ modelValue: { grant: true, career: 'other', name: 'x' } })
    await flush()
    expect(keys(lastErrors(wrapper))).toEqual(['required:/agency', 'required:/careerOther', 'minLength:/name'])

    await wrapper.setProps({ modelValue: { grant: false, career: 'other', name: 'x' } })
    await flush()
    expect(keys(lastErrors(wrapper))).toEqual(['required:/careerOther', 'minLength:/name'])
    wrapper.unmount()
  })

  it('follows the data changed from the form itself', async () => {
    const wrapper = mountForm({ schema, uischema, modelValue: { grant: true, career: 'x', name: 'abc' } })
    await flush()
    expect(keys(lastErrors(wrapper))).toEqual(['required:/agency'])
    // untick the grant toggle: the section and its required control disappear from the errors
    await wrapper.find('.q-toggle').trigger('click')
    await flush()
    expect(keys(lastErrors(wrapper))).toEqual([])
    wrapper.unmount()
  })
})
