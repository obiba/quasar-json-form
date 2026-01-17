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
    password: {
      label: 'Password Input',
      description: 'Please enter a password value',
    },
    multiLineString: {
      label: 'Multi-line String Input',
      description: 'Please enter a multi-line string value',
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
    computed: {
      label: 'Computed Value',
      description: 'This value is computed based on other fields',
    },
    rating: {
      label: 'Rating Selector',
      description: 'Please select a rating',
    },
    slider: {
      label: 'Slider Selector',
      description: 'Please select a value using the slider',
    },
    date: {
      label: 'Date Picker',
      description: 'Please select a date',
    },
    time: {
      label: 'Time Picker',
      description: 'Please select a time',
    },
    fulltime: {
      label: 'Fulltime Picker',
      description: 'Please select a fulltime value',
    },
    datetime: {
      label: 'DateTime Picker',
      description: 'Please select a date and time value',
    },
    datefulltime: {
      label: 'Date Fulltime Picker',
      description: 'Please select a date and fulltime value',
    },
    file: {
      title: 'File Upload',
      description: 'Please upload a file',
      label: 'File selector',
      hint: 'Select a file to upload',
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
    oneOfEnum: {
      label: 'Enum Selector with Label',
      description: 'Please select a value from the list with custom labels',
    },
    radios: {
      label: 'Radio Selector',
      description: 'Please select one value from the list',
    },
    oneOfRadios: {
      label: 'Radio Selector with Label',
      description: 'Please select one value from the list with custom labels',
    },
    multiEnum: {
      label: 'Multiple Enum Selector',
      description: 'Please select one or two values from the list',
    },
    oneOfMultiEnum: {
      label: 'Multiple Enum Selector with Label',
      description: 'Please select one or two values from the list with custom labels',
    },
    checkboxes: {
      label: 'Checkboxes Selector',
      description: 'Please select one or more values from the list',
    },
    toggles: {
      label: 'Toggles Selector',
      description: 'Please select one or more values from the list',
    },
    categories: {
      labels: {
        identification: 'Identification',
        address: 'Address',
        additional: 'Additional',
      },
      titles: {
        identification: 'Identification Information',
        address: 'Address Information',
      },
      descriptions: {
        identification: 'Please provide your identification details',
      }
    },
  },
  'add-item': 'Add Item',
  'no-items': 'No Items',
  'confirm-remove-item': 'Remove this item?',
  cancel: 'Cancel',
  remove: 'Remove',
};
