/* eslint-disable @typescript-eslint/no-explicit-any */
import { compileExpression, useDotAccessOperatorAndOptionalChaining } from 'filtrex'
import { computed } from 'vue'
import { countWords } from '../utils/words'

export class FiltrexRuleEngine {
  customFunctions: Record<string, (...args: any[]) => any>

  constructor() {
    this.customFunctions = {}

    // Add useful custom functions
    this.addFunction('isEmpty', (value: any) => {
      return value === null || value === undefined || value === ''
    })

    this.addFunction('isNotEmpty', (value: any) => {
      return value !== null && value !== undefined && value !== ''
    })

    // isNull(value): null or undefined (unlike isEmpty, an empty string is not null)
    this.addFunction('isNull', (value: any) => {
      return value === null || value === undefined
    })

    this.addFunction('isUndefined', (value: any) => {
      return value === undefined
    })

    this.addFunction('isBoolean', (value: any) => {
      return typeof value === 'boolean'
    })

    this.addFunction('ifElse', (condition: boolean, trueVal: any, falseVal: any) => {
      return condition ? trueVal : falseVal
    })

    this.addFunction('isNumber', (value: any) => {
      return typeof value === 'number' && !isNaN(value)
    })

    this.addFunction('isString', (value: any) => {
      return typeof value === 'string'
    })

    this.addFunction('length', (value: any) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length
      }
      return 0
    })

    this.addFunction('get', (value: any, idx: number) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value[idx]
      }
      return undefined
    })

    this.addFunction('startsWith', (value: any, prefix: string) => {
      if (typeof value !== 'string' || typeof prefix !== 'string') {
        return false
      }
      return value.startsWith(prefix)
    })

    this.addFunction('endsWith', (value: any, suffix: string) => {
      if (typeof value !== 'string' || typeof suffix !== 'string') {
        return false
      }
      return value.endsWith(suffix)
    })

    this.addFunction('matches', (value: any, pattern: string) => {
      // Limit pattern length to mitigate ReDoS risk
      if (typeof pattern !== 'string' || pattern.length > 100) {
        return false
      }
      try {
        return new RegExp(pattern).test(value)
      } catch (error) {
        console.error('Error evaluating regex pattern:', pattern, error)
        // Invalid regex pattern
        return false
      }
    })

    this.addFunction('inArray', (value: any, ...items: any[]) => {
      return items.includes(value)
    })

    // contains(list, value): true when an array (or a string) contains the value
    this.addFunction('contains', (container: any, value: any) => {
      if (Array.isArray(container) || typeof container === 'string') {
        return container.includes(value)
      }
      return false
    })

    // number of whitespace-separated words in a string
    this.addFunction('wordCount', (value: any) => countWords(value))

    // truthy(value): JavaScript truthiness (used by the transpiled ASF conditions)
    this.addFunction('truthy', (value: any) => !!value)
  }

  addFunction(name: string, fn: (...args: any[]) => any): void {
    this.customFunctions[name] = fn
  }

  evaluate(expression: string, context: Record<string, any>): any {
    try {
      const compiled = compileExpression(expression, {
        customProp: useDotAccessOperatorAndOptionalChaining,
        extraFunctions: this.customFunctions,
      })
      return compiled(context)
    } catch (error) {
      console.error('Error evaluating expression:', expression, error)
      return false
    }
  }

  /** The error of an expression that does not compile, undefined when it does (or is empty). */
  expressionError(expression: string): string | undefined {
    if (!expression.trim()) return undefined
    try {
      compileExpression(expression, {
        customProp: useDotAccessOperatorAndOptionalChaining,
        extraFunctions: this.customFunctions,
      })
      return undefined
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  validateExpression(expression: string): boolean {
    try {
      compileExpression(expression, {
        customProp: useDotAccessOperatorAndOptionalChaining,
        extraFunctions: this.customFunctions,
      })
      return true
    } catch (error) {
      console.error('Invalid expression:', expression, error)
      return false
    }
  }
}

// Singleton instance
export const filtrexEngine = new FiltrexRuleEngine()

// Composable for reactive rule evaluation
export function useFiltrexRules(formData: any) {
  const evaluateRule = (expression: string): any => {
    const val = formData.value
    return filtrexEngine.evaluate(expression, val)
  }

  const evaluateRuleComputed = (expression: string) => {
    return computed(() => evaluateRule(expression))
  }

  return {
    evaluateRule,
    evaluateRuleComputed,
    filtrexEngine,
  }
}
