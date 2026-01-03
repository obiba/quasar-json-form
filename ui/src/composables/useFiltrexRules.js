/* eslint-disable @typescript-eslint/no-explicit-any */
import { compileExpression, useDotAccessOperatorAndOptionalChaining } from 'filtrex';
import { computed } from 'vue';

export class FiltrexRuleEngine {
  constructor() {
    this.customFunctions = {};

    // Add useful custom functions
    this.addFunction('isEmpty', (value) => {
      return value === null || value === undefined || value === '';
    });

    this.addFunction('isNotEmpty', (value) => {
      return value !== null && value !== undefined && value !== '';
    });

    this.addFunction('ifElse', (condition, trueVal, falseVal) => {
      return condition ? trueVal : falseVal;
    });

    this.addFunction('isNumber', (value) => {
      return typeof value === 'number' && !isNaN(value);
    });

    this.addFunction('isString', (value) => {
      return typeof value === 'string';
    });

    this.addFunction('length', (value) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length;
      }
      return 0;
    });

    this.addFunction('get', (value, idx) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value[idx];
      }
      return undefined;
    });

    this.addFunction('startsWith', (value, prefix) => {
      if (typeof value !== 'string' || typeof prefix !== 'string') {
        return false;
      }
      return value.startsWith(prefix);
    });

    this.addFunction('endsWith', (value, suffix) => {
      if (typeof value !== 'string' || typeof suffix !== 'string') {
        return false;
      }
      return value.endsWith(suffix);
    });

    this.addFunction('matches', (value, pattern) => {
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

    this.addFunction('inArray', (value, ...items) => {
      return items.includes(value);
    });
  }

  addFunction(name, fn) {
    this.customFunctions[name] = fn;
  }

  evaluate(expression, context) {
    try {
      const compiled = compileExpression(expression, {
        customProp: useDotAccessOperatorAndOptionalChaining,
        extraFunctions: this.customFunctions,
      });
      return compiled(context);
    } catch (error) {
      console.error('Error evaluating expression:', expression, error);
      return false;
    }
  }

  validateExpression(expression) {
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
export function useFiltrexRules(formData) {
  const evaluateRule = (expression) => {
    const val = formData.value;
    return filtrexEngine.evaluate(expression, val);
  };

  const evaluateRuleComputed = (expression) => {
    return computed(() => evaluateRule(expression));
  };

  return {
    evaluateRule,
    evaluateRuleComputed,
    filtrexEngine,
  };
}
