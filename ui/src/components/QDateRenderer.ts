/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, watch, defineComponent, ref, computed, inject, onMounted } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QInput, QIcon, QPopupProxy, QDate, QBtn, date as qdate } from 'quasar'
import type { QPopupProxy as QPopupProxyInstance } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { useReportedErrors } from '../composables/useFormErrors'
import { DATA_KEY } from '../composables/keys'
import { getByPath, omitOptions, RENDERER_OPTION_KEYS } from '../utils/options'

/** angular-strap style masks (`yyyy-MM-dd`) to Quasar masks (`YYYY-MM-DD`) */
export function normalizeDateMask(mask: unknown): string | undefined {
  if (typeof mask !== 'string' || mask.length === 0) return undefined
  return mask.replace(/y/g, 'Y').replace(/d/g, 'D')
}

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const endOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
const pad2 = (n: number): string => String(n).padStart(2, '0')

/**
 * Date control (`format: date` / `datepicker`): text input with a QDate popup.
 * Options (directly or under `dateOptions`):
 * - `dateFormat`: mask of the stored value (`YYYY-MM-DD` by default, `YYYY-MM`
 *   for `format: year-month`; angular-strap masks like `yyyy-MM-dd` accepted);
 *   ignored for `format: date`, which AJV validates as an ISO date,
 * - `min` / `max`: bounds (also the `min` / `max` rules),
 * - `yearRef` / `monthRef` (`format: ymdatepicker`): names of the year and
 *   month fields (siblings, or from the root data) the date must belong to;
 *   the input is disabled until both are set and the value defaults to the
 *   first day of that month (`lastDay: true` for the last one).
 */
export default defineComponent({
  name: 'QDateRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t, translate } = useFormI18n()

    const popupRef = ref<QPopupProxyInstance | null>(null)
    const formData = inject<any>(DATA_KEY, ref({}))

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const {
      isVisible, isEnabled, isReadonly, inputLabel, rootClass, hasError, errorMessage, options, minValue, maxValue, validationMessage,
      renderHeader, hintSlot,
    } = useControlProperties(control)

    const dateOptions = computed<Record<string, any>>(() => {
      const nested = options.value.dateOptions && typeof options.value.dateOptions === 'object' ? options.value.dateOptions : {}
      const direct: Record<string, any> = {}
      for (const key of ['dateFormat', 'yearRef', 'monthRef', 'lastDay', 'min', 'max']) {
        if (options.value[key] !== undefined) direct[key] = options.value[key]
      }
      return { ...nested, ...direct }
    })

    const isYearMonth = computed(() => {
      return control.value.schema.format === 'year-month' || options.value.format === 'year-month'
    })

    // `format: date` is validated by AJV as an ISO date: the mask only applies
    // to the other formats (datepicker, ymdatepicker, year-month)
    const mask = computed<string>(() => {
      if (control.value.schema.format === 'date') return 'YYYY-MM-DD'
      return normalizeDateMask(dateOptions.value.dateFormat) || (isYearMonth.value ? 'YYYY-MM' : 'YYYY-MM-DD')
    })

    // Year / month references (ymdatepicker): sibling fields, then root fields
    const hasRefs = computed(() => !!(dateOptions.value.yearRef && dateOptions.value.monthRef))

    const refValue = (name: string): number | undefined => {
      const root = formData.value || {}
      const parentPath = String(control.value.path || '').split('.').filter((s) => s.length > 0).slice(0, -1)
      const parent = parentPath.length > 0 ? getByPath(root, parentPath) : root
      let value = parent?.[name]
      if (value === undefined || value === null) value = getByPath(root, name)
      const n = typeof value === 'string' ? parseInt(value, 10) : value
      return typeof n === 'number' && !isNaN(n) ? n : undefined
    }

    const refRange = computed<{ min: Date; max: Date } | undefined>(() => {
      if (!hasRefs.value) return undefined
      const year = refValue(String(dateOptions.value.yearRef))
      const month = refValue(String(dateOptions.value.monthRef))
      if (year === undefined || month === undefined || month < 1 || month > 12) return undefined
      return { min: new Date(year, month - 1, 1), max: new Date(year, month, 0) }
    })

    // the control value: must match the mask exactly
    const parseValue = (value: any): Date | undefined => {
      if (typeof value !== 'string' || value.length === 0) return undefined
      const parsed = qdate.extractDate(value, mask.value)
      return !isNaN(parsed.getTime()) && qdate.formatDate(parsed, mask.value) === value ? parsed : undefined
    }

    // a bound: a Date, a timestamp, a string in the mask format or an ISO date
    const parseBound = (value: any): Date | undefined => {
      if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value
      if (typeof value === 'number') return new Date(value)
      const parsed = parseValue(value)
      if (parsed) return parsed
      if (typeof value !== 'string' || value.length === 0) return undefined
      const fallback = new Date(value)
      return isNaN(fallback.getTime()) ? undefined : fallback
    }

    const bounds = computed<{ min?: Date; max?: Date }>(() => {
      if (refRange.value) return refRange.value
      return {
        min: parseBound(dateOptions.value.min ?? minValue.value),
        max: parseBound(dateOptions.value.max ?? maxValue.value),
      }
    })

    const formatBound = (d: Date): string => qdate.formatDate(d, mask.value)

    // messages: `dateOptions.validationMessage` (angular-schema-form
    // datepicker convention), then the control `options.validationMessage`
    const dateMessage = (name: string, fallbackKey: string, named?: Record<string, unknown>): string => {
      const custom = dateOptions.value.validationMessage?.[name]
      if (typeof custom === 'string' && custom.length > 0) return t(custom, named)
      return validationMessage(name, fallbackKey, named)
    }

    const rangeErrors = computed<string[]>(() => {
      const value = control.value.data
      if (value === undefined || value === null || value === '') return []
      const parsed = parseValue(value)
      if (!parsed) return [dateMessage('dateInvalid', 'error.dateInvalid', { format: mask.value })]
      const { min, max } = bounds.value
      const below = min !== undefined && parsed < startOfDay(min)
      const above = max !== undefined && parsed > endOfDay(max)
      if (!below && !above) return []
      if (hasRefs.value && min && max) {
        return [dateMessage('invalidYMDate', 'error.dateRange', { min: formatBound(min), max: formatBound(max) })]
      }
      if (min && max) {
        return [dateMessage('dateRange', 'error.dateRange', { min: formatBound(min), max: formatBound(max) })]
      }
      if (below && min) {
        return [dateMessage('dateMin', 'error.dateMin', { limit: formatBound(min) })]
      }
      return [dateMessage('dateMax', 'error.dateMax', { limit: formatBound(max!) })]
    })

    useReportedErrors(
      () => control.value.path,
      'date',
      computed(() => (isVisible.value ? rangeErrors.value : [])),
    )

    const dateValue = computed(() => control.value.data || '')

    const onChange = (value: any) => {
      controlResult.handleChange(control.value.path, value || undefined)
    }

    const defaultRefDate = (): string | undefined => {
      const range = refRange.value
      if (!range) return undefined
      return formatBound(dateOptions.value.lastDay === true ? range.max : range.min)
    }

    // ymdatepicker: follow the referenced year / month
    watch(refRange, (range, previous) => {
      if (!hasRefs.value || isReadonly.value) return
      if (!range) {
        if (control.value.data !== undefined) onChange(undefined)
        return
      }
      const changed = !previous || previous.min.getTime() !== range.min.getTime()
      if (changed || !control.value.data) {
        onChange(defaultRefDate())
      }
    })

    onMounted(() => {
      if (hasRefs.value && !isReadonly.value && refRange.value && !control.value.data) {
        onChange(defaultRefDate())
      }
    })

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined)
        }
      },
    )

    const closePopup = () => {
      popupRef.value?.hide()
    }

    // QDate `options`: selectable dates ('YYYY/MM/DD')
    const isSelectable = (candidate: string): boolean => {
      const { min, max } = bounds.value
      if (!min && !max) return true
      const d = qdate.extractDate(candidate, 'YYYY/MM/DD')
      if (min && d < startOfDay(min)) return false
      if (max && d > endOfDay(max)) return false
      return true
    }

    const navigationBound = (d: Date | undefined): string | undefined => {
      return d ? `${d.getFullYear()}/${pad2(d.getMonth() + 1)}` : undefined
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      const errors = [errorMessage.value, ...rangeErrors.value].filter((e) => e && e.length > 0)
      const refsMissing = hasRefs.value && !refRange.value
      const disabled = (!isEnabled.value || refsMissing) && !isReadonly.value

      return h('div', { class: ['q-date-renderer', rootClass.value] }, [...renderHeader(), h(QInput, {
        ...omitOptions(options.value, [...RENDERER_OPTION_KEYS, 'class']),
        modelValue: dateValue.value,
        'onUpdate:modelValue': onChange,
        label: inputLabel.value,
        error: hasError.value || rangeErrors.value.length > 0,
        errorMessage: errors.join('; '),
        required: control.value.required,
        disable: disabled,
        readonly: isReadonly.value,
      }, {
        ...hintSlot.value,
        ...(isReadonly.value || disabled ? {} : {
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
              mask: mask.value,
              options: bounds.value.min || bounds.value.max ? isSelectable : undefined,
              navigationMinYearMonth: navigationBound(bounds.value.min),
              navigationMaxYearMonth: navigationBound(bounds.value.max),
              defaultView: isYearMonth.value ? 'Months' : undefined,
              emitImmediately: isYearMonth.value,
              'onUpdate:modelValue': onChange,
            }, {
              default: () => h('div', {
                class: 'row items-center justify-end',
              }, [
                h(QBtn, {
                  label: translate('close'),
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
