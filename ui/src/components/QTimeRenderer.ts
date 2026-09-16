import { h, watch, defineComponent, ref, computed } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QInput, QIcon, QPopupProxy, QTime, QBtn } from 'quasar'
import type { QPopupProxy as QPopupProxyInstance } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { omitOptions } from '../utils/options'

export default defineComponent({
  name: 'QTimeRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()

    const popupRef = ref<QPopupProxyInstance | null>(null)

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const {
      isVisible, isEnabled, isReadonly, inputLabel, rootClass, hasError, errorMessage, options, renderHeader, hintSlot,
    } = useControlProperties(control)

    const timeValue = computed(() => control.value.data || '')

    const timeFormat = computed(() => {
      return control.value.schema.format || options.value.format || 'time'
    })

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined)
        }
      },
    )

    const onChange = (value: any) => {
      controlResult.handleChange(control.value.path, value || undefined)
    }

    const closePopup = () => {
      popupRef.value?.hide()
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h('div', { class: ['q-time-renderer', rootClass.value] }, [...renderHeader(), h(QInput, {
        ...omitOptions(options.value, ['class']),
        modelValue: timeValue.value,
        'onUpdate:modelValue': onChange,
        mask: timeFormat.value,
        rules: [timeFormat.value],
        label: inputLabel.value,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
      }, {
        ...hintSlot.value,
        ...(isReadonly.value ? {} : {
        append: () => h(QIcon, {
          name: 'access_time',
          class: 'cursor-pointer',
        }, {
          default: () => h(QPopupProxy, {
            ref: popupRef,
            cover: true,
            transitionShow: 'scale',
            transitionHide: 'scale',
          }, {
            default: () => h(QTime, {
              modelValue: timeValue.value,
              'onUpdate:modelValue': onChange,
              withSeconds: timeFormat.value === 'fulltime',
              format24h: true,
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
        }),
      })])
    }
  },
})
