import { describe, it, expect } from 'vitest'
import { transpileCondition, ConditionError } from '../src/asf/condition'
import { filtrexEngine } from '../src/composables/useFiltrexRules'

const evaluate = (condition: string, model: Record<string, unknown>) => filtrexEngine.evaluate(transpileCondition(condition), model)

describe('ASF condition transpiler', () => {
  it('translates the Mica default form conditions', () => {
    expect(transpileCondition("model.modificationNature.indexOf('IA') > -1")).toBe('contains(modificationNature, "IA")')
    expect(transpileCondition('model.dataSources.indexOf("biological_samples")>=0')).toBe('contains(dataSources, "biological_samples")')
    expect(transpileCondition('!model.hasNoStaff')).toBe('not (truthy(hasNoStaff))')
    expect(transpileCondition('model.grantSubmission')).toBe('truthy(grantSubmission)')
    expect(transpileCondition("model.career === 'other'")).toBe('career == "other"')
    expect(transpileCondition('model.methods.design=="other"')).toBe('methods.design == "other"')
    expect(transpileCondition("model.access.access_data=='yes' || model.access.access_bio_samples=='yes' || model.access.access_other=='yes'"))
      .toBe('access.access_data == "yes" or access.access_bio_samples == "yes" or access.access_other == "yes"')
    expect(transpileCondition("model.access_restrictions && (model.access.access_data=='yes' || model.access.access_other=='yes')"))
      .toBe('truthy(access_restrictions) and (access.access_data == "yes" or access.access_other == "yes")')
  })

  it('maps the indexOf() comparison forms to contains()', () => {
    expect(transpileCondition('model.a.indexOf("x") != -1')).toBe('contains(a, "x")')
    expect(transpileCondition('model.a.indexOf("x") !== -1')).toBe('contains(a, "x")')
    expect(transpileCondition('model.a.indexOf("x") < 0')).toBe('not (contains(a, "x"))')
    expect(transpileCondition('model.a.indexOf("x") === -1')).toBe('not (contains(a, "x"))')
    expect(transpileCondition('0 <= model.a.indexOf("x")')).toBe('contains(a, "x")')
    expect(transpileCondition('model.a.includes("x")')).toBe('contains(a, "x")')
    expect(transpileCondition('!model.a.includes("x")')).toBe('not (contains(a, "x"))')
    expect(() => transpileCondition('model.a.indexOf("x") > 2')).toThrow(ConditionError)
  })

  it('handles null, booleans, numbers and length', () => {
    expect(transpileCondition('model.a == null')).toBe('isNull(a)')
    expect(transpileCondition('model.a === null')).toBe('isNull(a)')
    expect(transpileCondition('model.a != null')).toBe('not (isNull(a))')
    expect(transpileCondition('model.a !== undefined')).toBe('not (isNull(a))')
    expect(transpileCondition('model.a === true')).toBe('truthy(a)')
    expect(transpileCondition('model.a == false')).toBe('not (truthy(a))')
    expect(transpileCondition('model.a.length > 0')).toBe('length(a) > 0')
    expect(transpileCondition('model.n >= 3')).toBe('(isNotEmpty(n) and n >= 3)')
    expect(transpileCondition('model.n == -1')).toBe('n == -1')
    expect(transpileCondition('true')).toBe('1 == 1')
  })

  it('rejects what it cannot translate', () => {
    expect(() => transpileCondition('arrayIndex > 0')).toThrow(/unsupported identifier/)
    expect(() => transpileCondition('model["a-b"] == 1')).toThrow(ConditionError)
    expect(() => transpileCondition('model.a.filter(function(){})')).toThrow(ConditionError)
    expect(() => transpileCondition('model.a ? 1 : 2')).toThrow(ConditionError)
    expect(() => transpileCondition('model.a == "unterminated')).toThrow(/unterminated/)
    expect(() => transpileCondition('')).toThrow(/empty/)
    expect(() => transpileCondition('model')).toThrow(ConditionError)
  })

  it('evaluates like JavaScript with the filtrex engine', () => {
    expect(evaluate('!model.hasNoStaff', {})).toBe(true)
    expect(evaluate('!model.hasNoStaff', { hasNoStaff: true })).toBe(false)
    expect(evaluate('model.grantSubmission', { grantSubmission: true })).toBe(true)
    expect(evaluate('model.grantSubmission', {})).toBe(false)
    expect(evaluate("model.modificationNature.indexOf('IA') > -1", { modificationNature: ['IB', 'IA'] })).toBe(true)
    expect(evaluate("model.modificationNature.indexOf('IA') > -1", {})).toBe(false)
    expect(evaluate('model.recruitment.dataSources.indexOf("other")>=0', { recruitment: {} })).toBe(false)
    expect(evaluate('model.methods.design=="other"', {})).toBe(false)
    expect(evaluate('model.methods.design=="other"', { methods: { design: 'other' } })).toBe(true)
    expect(evaluate("model.access_restrictions && (model.access.access_data=='yes' || model.access.access_other=='yes')",
      { access_restrictions: true, access: { access_other: 'yes' } })).toBe(true)
    expect(evaluate("model.access_restrictions && (model.access.access_data=='yes' || model.access.access_other=='yes')",
      { access_restrictions: true, access: { access_other: 'no' } })).toBe(false)
    expect(evaluate('model.n >= 3', {})).toBe(false)
    expect(evaluate('model.n >= 3', { n: 3 })).toBe(true)
    expect(evaluate('model.a == null', {})).toBe(true)
    expect(evaluate('model.a == null', { a: null })).toBe(true)
    expect(evaluate('model.a === null', { a: '' })).toBe(false)
    expect(evaluate('model.a !== undefined', { a: '' })).toBe(true)
    expect(evaluate('model.a !== undefined', {})).toBe(false)
    expect(evaluate('model.a.length > 0', { a: ['x'] })).toBe(true)
  })
})
