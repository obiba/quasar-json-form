/* eslint-disable @typescript-eslint/no-explicit-any */
import { compileExpression, useDotAccessOperatorAndOptionalChaining } from 'filtrex'
import { computed } from 'vue'

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
