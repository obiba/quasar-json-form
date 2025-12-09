/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, inject, ref } from 'vue';
import { useFiltrexRules } from './useFiltrexRules';

export function useControlProperties(control) {
  // Inject form data from provider
  const injectedFormData = inject('jsonforms-data', ref({}));

  const { evaluateRule } = useFiltrexRules(injectedFormData);

  // Extract rule options from UI schema
  const ruleOptions = computed(() => {
    const schema = control.value.schema;
    return schema.rules || {};
  });

  // Visibility rule
  const isVisible = computed(() => {
    const rule = ruleOptions.value.visible;
    if (!rule) return true;
    try {
      return evaluateRule(rule);
    } catch (error) {
      console.error('Error evaluating visibility rule:', rule, error);
      return true;
    }
  });

  // Enable rule
  const isEnabled = computed(() => {
    if (!control.value.enabled) return false;
    const rule = ruleOptions.value.enabled;
    if (!rule) return true;
    try {
      const rval = evaluateRule(rule);
      return rval === true;
    } catch (error) {
      console.error('Error evaluating enable rule:', rule, error);
      return false;
    }
  });

  // Custom validation
  const customValidationErrors = computed(() => {
    const rules = ruleOptions.value.validation || [];
    const errors = [];

    rules.forEach((rule) => {
      try {
        const expression = rule.expr || rule.expression;
        if (expression && !evaluateRule(expression)) {
          errors.push(rule.message);
        }
      } catch (error) {
        console.error('Error evaluating validation rule:', expression, error);
      }
    });

    return errors;
  });

  // Combined errors
  const hasError = computed(() => {
    return control.value.errors.length > 0 || customValidationErrors.value.length > 0;
  });

  const errorMessage = computed(() => {
    const jsonFormsErrors = Array.isArray(control.value.errors)
      ? control.value.errors
      : [control.value.errors];
    const customErrors = customValidationErrors.value;
    // Combine both error arrays
    const allErrors = [...jsonFormsErrors, ...customErrors].filter((e) => e && e.length > 0);
    return allErrors.join(', ');
  });

  // Extract options from schema
  const uiOptions = computed(() => {
    const uiSchema = control.value.uiSchema;
    return (uiSchema && uiSchema.options) || {};
  });

  return {
    isVisible,
    isEnabled,
    hasError,
    errorMessage,
    uiOptions,
    ruleOptions,
  };
}
