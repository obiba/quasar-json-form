export default {
  json_form: 'JSON Form',
  failed: 'Action failed',
  success: 'Action was successful',
  close: 'Close',
  schema: 'Schema',
  layout: 'Layout',
  form: 'Form',
  renderers: {
    label: {
      text: 'This is a Label with **Markdown** support',
    },
    section: {
      label: 'Section',
      description: 'A **section** to announce fields',
    },
    string: {
      label: 'String Input',
      description: 'Please enter a string value',
    },
    boolean: {
      label: 'Boolean Toggle',
      description: 'Please toggle the boolean value',
    },
    number: {
      label: 'Number Input',
      description: 'Please enter a numeric value',
    },
    integer: {
      label: 'Integer Input',
      description: 'Please enter an integer value',
      number_must_be_even: 'Number must be even',
    },
    rating: {
      label: 'Rating Selector',
      description: 'Please select a rating',
    },
    date: {
      label: 'Date Picker',
      description: 'Please select a date',
    },
    enum: {
      label: 'Enum Selector',
      description: 'Please select a value from the list',
      options: {
        one: 'Option One',
        two: 'Option Two',
        three: 'Option Three',
      }
    },
    enums: {
      label: 'Multiple Enum Selector',
      description: 'Please select one or two values from the list',
    },
  }
};
