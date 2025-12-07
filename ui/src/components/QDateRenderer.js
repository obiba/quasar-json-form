import { h, watch, defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QInput, QIcon, QPopupProxy, QDate, QBtn } from 'quasar';
import { useControlRules } from '../composables/useControlRules';

export default defineComponent({
  name: 'QDateRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    // Use the generic control rules composable
    const { isVisible, isEnabled, hasError, errorMessage, hint, componentProps } =
      useControlRules(control);

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined);
        }
      },
    );

    const onChange = (value) => {
      controlResult.handleChange(control.value.path, value);
    };

    return () => {
      if (!isVisible.value) {
        return null;
      }

      return h(QInput, {
        modelValue: control.value.data,
        'onUpdate:modelValue': onChange,
        label: control.value.label,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value,
        hint: control.value.description || hint.value,
        ...componentProps.value,
      }, {
        append: () => h(QIcon, {
          name: 'event',
          class: 'cursor-pointer',
        }, {
          default: () => h(QPopupProxy, {
            cover: true,
            transitionShow: 'scale',
            transitionHide: 'scale',
          }, {
            default: () => h(QDate, {
              modelValue: control.value.data,
              mask: 'YYYY-MM-DD',
              'onUpdate:modelValue': onChange,
            }, {
              default: () => h('div', {
                class: 'row items-center justify-end',
              }, [
                h(QBtn, {
                  label: t('close'),
                  color: 'primary',
                  flat: true,
                  directives: [{
                    name: 'close-popup',
                  }],
                }),
              ]),
            }),
          }),
        }),
      });
    };
  },
});
