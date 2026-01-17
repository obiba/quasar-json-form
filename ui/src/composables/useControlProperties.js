/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, inject, ref, watch } from 'vue';
import { useFiltrexRules } from './useFiltrexRules';
import { useI18n } from 'vue-i18n';

export function useControlProperties(control) {
  const { t } = useI18n();

  // Inject form data from provider
  const injectedFormData = inject('jsonforms-data', ref({}));

  const { evaluateRule } = useFiltrexRules(injectedFormData);

  // Extract rule options from UI schema
  const ruleOptions = computed(() => {
    const schemaRules = control.value.schema.rules || {};
    const uischemaRules = control.value.uischema.rules || {};
    // merge rules, override uischema rules over schema rules
    const rules = {
      ...schemaRules,
      ...uischemaRules,
    };
    return rules;
  });

  // Visibility rule
  const isVisible = computed(() => {
    const rule = ruleOptions.value.visible;
    if (!rule) return true;
    try {
      const rval = evaluateRule(rule);
      return rval === true;
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

  // Max rule
  const maxValue = computed(() => {
    const rule = ruleOptions.value.max;
    if (!rule) return undefined;
    try {
      return evaluateRule(rule);
    } catch (error) {
      console.error('Error evaluating max rule:', rule, error);
      return undefined;
    }
  });

  // Min rule
  const minValue = computed(() => {
    const rule = ruleOptions.value.min;
    if (!rule) return undefined;
    try {
      return evaluateRule(rule);
    } catch (error) {
      console.error('Error evaluating min rule:', rule, error);
      return undefined;
    }
  });

  // Compute rule
  const computeValue = computed(() => {
    const rule = ruleOptions.value.compute;
    if (!rule) return undefined;
    try {
      return evaluateRule(rule);
    } catch (error) {
      console.error('Error evaluating compute rule:', rule, error);
      return undefined;
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
          errors.push(t(rule.message));
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
    return allErrors.join('; ');
  });

  // Extract options from schema
  const uiOptions = computed(() => {
    const uiSchema = control.value.uischema;
    return (uiSchema && uiSchema.options) || {};
  });

  // Transform enum values into q-select options
  const selectOptions = computed(() => {
    const schema = control.value.schema;

    const optionVisible = (val) => {
      if (val.rules && val.rules.visible) {
        try {
          return evaluateRule(val.rules.visible);
        }
        catch (error) {
          console.error('Error evaluating visibility rule for option:', val, error);
          return true;
        }
      }
      return true;
    };

    if (schema.type === 'array' && schema.items) {
      const itemsSchema = schema.items;
      if (itemsSchema.oneOf && Array.isArray(itemsSchema.oneOf) && itemsSchema.oneOf.length > 0) {
        // for each oneOf item, filter by visibility and map to label/value
        return itemsSchema.oneOf
          .filter(optionVisible)
          .map((val) => {
            return { label: t(String(val.title || val.const)), value: val.const };
          });
      }

      if (itemsSchema.enum) {
        return itemsSchema.enum.map((value) => ({
          label: t(String(value)),
          value: value,
        }));
      }
    }

    if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
      // for each oneOf item, filter by visibility and map to label/value
      return schema.oneOf
        .filter(optionVisible)
        .map((val) => {
          return { label: t(String(val.title || val.const)), value: val.const };
        });
    }

    if (schema.enum) {
      return schema.enum.map((value) => ({
        label: t(String(value)),
        value: value,
      }));
    }

    return [];
  });

  // Check if current value is valid (exists in selectOptions)
  const isValueValid = computed(() => {
    const currentValue = control.value.data;
    const options = selectOptions.value;
    
    // If no value is set, it's valid (empty state)
    if (currentValue === undefined || currentValue === null) {
      return true;
    }
    
    // Create a Set of option values for O(1) lookup performance
    const optionValues = new Set(options.map(opt => opt.value));
    
    // Handle array values (multiple selection)
    if (Array.isArray(currentValue)) {
      // All selected values must exist in the options
      return currentValue.every(val => optionValues.has(val));
    }
    
    // Handle single value
    return optionValues.has(currentValue);
  });

  const title = computed(() => {
    return control.value.uischema.title || control.value.schema.title || undefined;
  });

  const description = computed(() => {
    return control.value.uischema.description || control.value.schema.description || undefined;
  });

  const label = computed(() => {
    return control.value.uischema.label || control.value.schema.label || undefined;
  });

  const hint = computed(() => {
    return control.value.uischema.hint || control.value.schema.hint || undefined;
  });

  // Function to clear invalid selections
  const clearInvalidSelection = (handleChange) => {
    return watch(
      [selectOptions, () => control.value.data],
      () => {
        const currentValue = control.value.data;
        const options = selectOptions.value;
        
        // Only clear if we have options and the current value is invalid
        // Don't clear if options are empty (might be temporary)
        // isValueValid already returns true for undefined/null, so we only get here
        // when there's an actual invalid selection that needs to be cleared
        if (options.length > 0 && !isValueValid.value) {
          // Clear the selection if it's no longer valid
          const schema = control.value.schema;
          const isMultiple = schema.type === 'array';
          handleChange(control.value.path, isMultiple ? [] : undefined);
        }
      },
      { immediate: false }
    );
  };

  return {
    isVisible,
    isEnabled,
    maxValue,
    minValue,
    computeValue,
    hasError,
    errorMessage,
    uiOptions,
    selectOptions,
    isValueValid,
    title,
    description,
    label,
    hint,
    clearInvalidSelection,
  };
}
