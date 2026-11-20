import type { Ref } from 'vue'
import type { QPopupProxy } from 'quasar'

/**
 * Click handler for a QInput that opens its picker popup, so that the whole
 * field opens it and not only the icon the popup is attached to. Clicks in the
 * append area are left alone: the icon opens the popup itself, and the clear
 * button must not open it.
 */
export function openPopupOnClick(popupRef: Ref<QPopupProxy | null>) {
  return (evt: Event) => {
    const target = evt.target as Element | null
    if (target?.closest?.('.q-field__append')) return
    popupRef.value?.show()
  }
}
