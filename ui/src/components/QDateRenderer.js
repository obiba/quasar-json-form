import { h, watch, defineComponent, ref, computed } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QInput, QIcon, QPopupProxy, QDate, QBtn } from 'quasar';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QDateRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();

    const popupRef = ref(null);

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    const { isVisible, isEnabled, hasError, errorMessage, uiOptions } =
      useControlProperties(control);

    const dateValue = computed(() => control.value.data || '');

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined);
        }
      },
    );

    const onChange = (value) => {
      controlResult.handleChange(control.value.path, value || undefined);
    };

    const closePopup = () => {
      if (popupRef.value) {
        popupRef.value.hide();
      }
    };

    return () => {
      if (!isVisible.value) {
        return null;
      }

      return h(QInput, {
        modelValue: dateValue.value,
        'onUpdate:modelValue': onChange,
        label: control.value.label ? t(control.value.label) : undefined,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value,
        hint: control.value.description ? t(control.value.description) : undefined,
        ...uiOptions.value,
      }, {
        append: () => h(QIcon, {
          name: 'event',
          class: 'cursor-pointer',
        }, {
          default: () => h(QPopupProxy, {
            ref: popupRef,
            cover: true,
            transitionShow: 'scale',
            transitionHide: 'scale',
          }, {
            default: () => h(QDate, {
              modelValue: dateValue.value,
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
                  onClick: closePopup,
                }),
              ]),
            }),
          }),
        }),
      });
    };
  },
});
