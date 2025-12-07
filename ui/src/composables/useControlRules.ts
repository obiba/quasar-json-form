/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, inject, ref, type ComputedRef, type Ref } from 'vue';
import type { ControlElement } from '@jsonforms/core';
import { useFiltrexRules } from './useFiltrexRules';

interface ControlRuleOptions {
  visibilityRule?: string;
  enableRule?: string;
  validationRules?: Array<{
    expression: string;
    message: string;
  }>;
  hint?: string;
  componentProps?: Record<string, unknown>;
}

export function useControlRules(control: ComputedRef<any>) {
  // Inject form data from provider
  const injectedFormData = inject<Ref<any>>('jsonforms-data', ref({}));

  const { evaluateRule } = useFiltrexRules(injectedFormData);

  // Extract rule options from UI schema
  const ruleOptions = computed((): ControlRuleOptions => {
    const uischema = control.value.uischema as ControlElement & {
      options?: ControlRuleOptions;
    };
    return uischema.options || {};
  });

  // Visibility rule
  const isVisible = computed(() => {
    const rule = ruleOptions.value.visibilityRule;
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
    const rule = ruleOptions.value.enableRule;
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
    const rules = ruleOptions.value.validationRules || [];
    const errors: string[] = [];

    rules.forEach((rule) => {
      try {
        if (!evaluateRule(rule.expression)) {
          errors.push(rule.message);
        }
      } catch (error) {
        console.error('Error evaluating validation rule:', rule.expression, error);
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
    const allErrors = [...jsonFormsErrors, ...customErrors];
    return allErrors.join(', ');
  });

  const hint = computed(() => ruleOptions.value.hint);

  const componentProps = computed(() => ruleOptions.value.componentProps || {});

  return {
    isVisible,
    isEnabled,
    hasError,
    errorMessage,
    hint,
    componentProps,
    ruleOptions,
  };
}
