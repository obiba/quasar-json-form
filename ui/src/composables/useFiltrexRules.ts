/* eslint-disable @typescript-eslint/no-explicit-any */
import { compileExpression, useDotAccessOperatorAndOptionalChaining } from 'filtrex';
import type { Ref } from 'vue';
import { computed } from 'vue';

export interface FiltrexRule {
  expression: string;
  message?: string;
}

export interface RuleContext {
  data: Record<string, unknown>;
  schema?: Record<string, unknown>;
  uischema?: Record<string, unknown>;
}

export class FiltrexRuleEngine {
  private customFunctions: Record<string, any> = {};

  constructor() {
    // Add useful custom functions
    this.addFunction('isEmpty', (value: any) => {
      return value === null || value === undefined || value === '';
    });

    this.addFunction('isNotEmpty', (value: any) => {
      return value !== null && value !== undefined && value !== '';
    });

    this.addFunction('length', (value: any) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length;
      }
      return 0;
    });

    this.addFunction('matches', (value: string, pattern: string) => {
      // Limit pattern length to mitigate ReDoS risk
      if (typeof pattern !== 'string' || pattern.length > 100) {
        return false;
      }
      try {
        return new RegExp(pattern).test(value);
      } catch (error) {
        console.error('Error evaluating regex pattern:', pattern, error);
        // Invalid regex pattern
        return false;
      }
    });

    this.addFunction('inArray', (value: any, ...items: any[]) => {
      return items.includes(value);
    });
  }

  addFunction(name: string, fn: (...args: any[]) => any) {
    this.customFunctions[name] = fn;
  }

  evaluate(expression: string, context: any): boolean {
    try {
      const compiled = compileExpression(expression, {
        customProp: useDotAccessOperatorAndOptionalChaining,
        extraFunctions: this.customFunctions,
      });
      return compiled(context) as boolean;
    } catch (error) {
      console.error('Error evaluating expression:', expression, error);
      return false;
    }
  }

  validateExpression(expression: string): boolean {
    try {
      compileExpression(expression, {
        customProp: useDotAccessOperatorAndOptionalChaining,
        extraFunctions: this.customFunctions,
      });
      return true;
    } catch (error) {
      console.error('Invalid expression:', expression, error);
      return false;
    }
  }
}

// Singleton instance
export const filtrexEngine = new FiltrexRuleEngine();

// Composable for reactive rule evaluation
export function useFiltrexRules(formData: Ref<any>) {
  const evaluateRule = (expression: string): boolean => {
    const val = formData.value;
    return filtrexEngine.evaluate(expression, val);
  };

  const evaluateRuleComputed = (expression: string) => {
    return computed(() => evaluateRule(expression));
  };

  return {
    evaluateRule,
    evaluateRuleComputed,
    filtrexEngine,
  };
}
