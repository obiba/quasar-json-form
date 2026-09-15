import { h, watch, defineComponent, ref, computed } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QInput, QIcon, QPopupProxy, QDate, QBtn } from 'quasar'
import type { QPopupProxy as QPopupProxyInstance } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'QDateRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useI18n()

    const popupRef = ref<QPopupProxyInstance | null>(null)

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    })

    const control = controlResult.control

    const { isVisible, isEnabled, isReadonly, inputLabel, hasError, errorMessage, options } =
      useControlProperties(control)

    const dateValue = computed(() => control.value.data || '')

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

      return h(QInput, {
        modelValue: dateValue.value,
        'onUpdate:modelValue': onChange,
        label: inputLabel.value,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
        hint: control.value.description ? t(control.value.description) : undefined,
        ...options.value,
      }, isReadonly.value ? {} : {
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
      })
    }
  },
})
