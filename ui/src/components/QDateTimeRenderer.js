import { h, watch, defineComponent, ref, computed } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QInput, QIcon, QPopupProxy, QDate, QTime, QBtn } from 'quasar';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QDateTimeRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();

    const datePopupRef = ref(null);
    const timePopupRef = ref(null);

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    const { isVisible, isEnabled, hasError, errorMessage, uiOptions } =
      useControlProperties(control);

    const dateValue = computed(() => control.value.data || '');

    const mask = computed(() => {
      const format = control.value.schema.format || uiOptions.value.format || 'date-time';
      return format === 'date-time' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD HH:mm:ss';
    });

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

    const closeDatePopup = () => {
      if (datePopupRef.value) {
        datePopupRef.value.hide();
      }
    };

    const closeTimePopup = () => {
      if (timePopupRef.value) {
        timePopupRef.value.hide();
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
        append: () => h('div', {}, [
          h(QIcon,
            {
              name: 'event',
              class: 'cursor-pointer',
            },
            {
              default: () => h(QPopupProxy, {
                ref: datePopupRef,
                cover: true,
                transitionShow: 'scale',
                transitionHide: 'scale',
              }, {
                default: () => h(QDate, {
                  modelValue: dateValue.value,
                  mask: mask.value,
                  'onUpdate:modelValue': onChange,
                }, {
                  default: () => h('div', {
                    class: 'row items-center justify-end',
                  }, [
                    h(QBtn, {
                      label: t('close'),
                      color: 'primary',
                      flat: true,
                      onClick: closeDatePopup,
                    }),
                  ]),
                }),
              }),
          }),
          h(QIcon, 
            {
              name: 'access_time',
              class: 'cursor-pointer',
            },
            {
              default: () => h(QPopupProxy, {
                ref: timePopupRef,
                cover: true,
                transitionShow: 'scale',
                transitionHide: 'scale',
              }, {
                default: () => h(QTime, {
                  modelValue: dateValue.value,
                  'onUpdate:modelValue': onChange,
                  mask: mask.value,
                  withSeconds: mask.value === 'YYYY-MM-DD HH:mm:ss',
                  format24h: true,
                }, {
                  default: () => h('div', {
                    class: 'row items-center justify-end',
                  }, [
                    h(QBtn, {
                      label: t('close'),
                      color: 'primary',
                      flat: true,
                      onClick: closeTimePopup,
                    }),
                  ]),
                }),
              }),
            },
          )])
        });
      };
    },
  });