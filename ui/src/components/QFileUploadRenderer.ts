/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, watch, defineComponent, ref, computed, reactive } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QBtn, QList, QItem, QItemSection, QIcon, QLinearProgress } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { useReportedErrors } from '../composables/useFormErrors'
import { renderMarkdown } from '../utils/markdown'
import { getByPath, formatFileSize } from '../utils/options'

/** A file in the form data (any extra property returned by the server is kept) */
export interface FileItem {
  id?: string
  fileName?: string
  name?: string
  size?: number
  path?: string
  /** set on the files uploaded in this session (the Mica convention) */
  justUploaded?: boolean
  [key: string]: any
}

export interface FileUploadContext {
  path: string
  schema: any
  uischema: any
  options: Record<string, any>
}

/**
 * Programmatic upload flow, passed through the QJsonForm `config` prop as
 * `config.fileUpload`. When `upload` is not defined, the declarative flow
 * (`uploadUrl`, `metadataUrl`, `pathKey`... options) is used.
 */
export interface FileUploadHooks {
  /** uploads the file and returns the file item to store (or the path, for string controls) */
  upload?: (file: File, context: FileUploadContext) => Promise<FileItem | string>
  /** called after a file is removed from the form data */
  remove?: (item: FileItem, context: FileUploadContext) => Promise<void> | void
  /** download link of a stored file */
  downloadUrl?: (item: FileItem, context: FileUploadContext) => string | undefined
}

interface PendingUpload {
  name: string
  progress: number
}

type Mode = 'path' | 'array' | 'object'

/**
 * File upload control:
 * - `type: string, format: file`: the uploaded file path (JSON response `pathKey`),
 * - `type: array, format: files`: a list of file items,
 * - `type: object, format: files` / `obibaFiles`: `{ [itemsKey]: [...] }`
 *   (`itemsKey` defaults to `obibaFiles` for that format, `files` otherwise).
 */
export default defineComponent({
  name: 'QFileUploadRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t, translate } = useFormI18n()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const {
      isVisible, isEnabled, isReadonly, requiredMark, rootClass, options, config, title, description, label,
      minValue, maxValue, hasError, errorMessage, validationMessage,
    } = useControlProperties(control)

    const fileInputRef = ref<HTMLInputElement | null>(null)
    const pending = ref<PendingUpload[]>([])
    const uploadError = ref<string | null>(null)

    const mode = computed<Mode>(() => {
      const type = control.value.schema.type
      return type === 'array' ? 'array' : type === 'object' ? 'object' : 'path'
    })

    const itemsKey = computed<string>(() => {
      if (options.value.itemsKey) return String(options.value.itemsKey)
      const format = control.value.schema.format || options.value.format
      return format === 'obibaFiles' ? 'obibaFiles' : 'files'
    })

    const files = computed<FileItem[]>(() => {
      const data = control.value.data
      if (mode.value === 'path') {
        return typeof data === 'string' && data.length > 0 ? [{ path: data, fileName: data }] : []
      }
      if (mode.value === 'array') {
        return Array.isArray(data) ? data : []
      }
      const list = data && typeof data === 'object' ? data[itemsKey.value] : undefined
      return Array.isArray(list) ? list : []
    })

    const toCount = (value: any): number | undefined => (typeof value === 'number' && !isNaN(value) ? value : undefined)
    const minItems = computed(() => toCount(control.value.schema.minItems ?? minValue.value))
    const maxItems = computed(() => toCount(control.value.schema.maxItems ?? maxValue.value))

    const isMultiple = computed<boolean>(() => {
      if (mode.value === 'path') return false
      if (typeof options.value.multiple === 'boolean') return options.value.multiple
      return maxItems.value !== 1
    })

    const canAdd = computed<boolean>(() => {
      if (files.value.length === 0) return true
      if (!isMultiple.value) return false
      return maxItems.value === undefined || files.value.length < maxItems.value
    })

    const context = (): FileUploadContext => ({
      path: control.value.path,
      schema: control.value.schema,
      uischema: control.value.uischema,
      options: options.value,
    })

    const hooks = computed<FileUploadHooks>(() => config.value.fileUpload || {})

    const setFiles = (list: FileItem[]) => {
      const path = control.value.path
      if (mode.value === 'path') {
        const first = list[0]
        controlResult.handleChange(path, first ? (first.path ?? first.fileName) : undefined)
        return
      }
      if (mode.value === 'array') {
        controlResult.handleChange(path, list.length > 0 ? list : undefined)
        return
      }
      const data = control.value.data && typeof control.value.data === 'object' ? control.value.data : {}
      controlResult.handleChange(path, { ...data, [itemsKey.value]: list })
    }

    // Renderer-level validation (AJV covers `required` on a missing value and
    // `minItems` / `maxItems` on arrays)
    const fileErrors = computed<string[]>(() => {
      const errors: string[] = []
      const data = control.value.data
      if (data === undefined || data === null) return errors
      const count = files.value.length
      if (control.value.required && count === 0) {
        errors.push(validationMessage('missingFiles', 'files.missing'))
      } else if (mode.value === 'object') {
        if (minItems.value !== undefined && count < minItems.value) {
          errors.push(validationMessage('minItems', 'files.minItems', { limit: minItems.value }))
        }
        if (maxItems.value !== undefined && count > maxItems.value) {
          errors.push(validationMessage('maxItems', 'files.maxItems', { limit: maxItems.value }))
        }
      }
      return errors
    })

    useReportedErrors(
      () => control.value.path,
      'files',
      computed(() => (isVisible.value ? fileErrors.value : [])),
    )

    const openFilePicker = () => {
      fileInputRef.value?.click()
    }

    const handleFileSelected = (event: Event) => {
      const target = event.target as HTMLInputElement
      const selected = Array.from(target.files || [])
      if (selected.length > 0) {
        uploadFiles(selected)
      }
      // Reset input so same file can be selected again
      target.value = ''
    }

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          controlResult.handleChange(control.value.path, undefined)
          uploadError.value = null
        }
      },
    )

    const readResponse = async (xhr: XMLHttpRequest, file: File): Promise<FileItem | string> => {
      const location = xhr.getResponseHeader('Location')
      const id = location ? location.split('/').filter((s) => s.length > 0).pop() : undefined
      let body: any
      if (xhr.responseText) {
        try {
          body = JSON.parse(xhr.responseText)
        } catch (error) {
          body = undefined
        }
      }

      if (options.value.metadataUrl && id) {
        const url = String(options.value.metadataUrl).replace('{id}', id)
        const response = await fetch(url, { headers: { Accept: 'application/json', ...(options.value.uploadHeaders || {}) } })
        if (!response.ok) {
          throw new Error(`Metadata request failed with status ${response.status}`)
        }
        return await response.json()
      }

      const pathKey = options.value.pathKey || (mode.value === 'path' ? 'path' : undefined)
      if (pathKey && body !== undefined) {
        const value = getByPath(body, pathKey)
        if (value === undefined || value === null) {
          throw new Error(`Response does not contain ${pathKey} field`)
        }
        return value
      }
      if (body && typeof body === 'object') return body
      if (typeof body === 'string') return body
      if (id) return { id, fileName: file.name, size: file.size }
      throw new Error('Invalid response from upload server')
    }

    const xhrUpload = (file: File, onProgress: (progress: number) => void): Promise<FileItem | string> => {
      return new Promise((resolve, reject) => {
        const uploadUrl = options.value.uploadUrl
        if (!uploadUrl) {
          reject(new Error(translate('files.uploadUrlMissing')))
          return
        }
        const xhr = new XMLHttpRequest()
        xhr.open(options.value.uploadMethod || 'POST', uploadUrl)
        Object.entries(options.value.uploadHeaders || {}).forEach(([name, value]) => {
          xhr.setRequestHeader(name, String(value))
        })
        if (options.value.withCredentials === true) {
          xhr.withCredentials = true
        }
        xhr.upload.onprogress = (event: ProgressEvent) => {
          if (event.lengthComputable) {
            onProgress(Math.round((100 * event.loaded) / event.total))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(`Upload failed with status ${xhr.status}`))
            return
          }
          readResponse(xhr, file).then(resolve).catch(reject)
        }
        const formData = new FormData()
        formData.append(options.value.fileField || 'file', file, file.name)
        xhr.send(formData)
      })
    }

    const toItem = (result: FileItem | string, file: File): FileItem => {
      if (typeof result === 'string') {
        const item: FileItem = { path: result, fileName: file.name, size: file.size }
        return mode.value === 'path' ? item : { ...item, justUploaded: true }
      }
      return { fileName: file.name, size: file.size, ...result, justUploaded: true }
    }

    const uploadFiles = async (selected: File[]) => {
      uploadError.value = null
      const current = [...files.value]
      for (const file of (isMultiple.value ? selected : selected.slice(0, 1))) {
        if (!isMultiple.value && current.length > 0) break
        if (maxItems.value !== undefined && isMultiple.value && current.length >= maxItems.value) break
        const entry: PendingUpload = reactive({ name: file.name, progress: 0 })
        pending.value = [...pending.value, entry]
        try {
          const result = hooks.value.upload
            ? await hooks.value.upload(file, context())
            : await xhrUpload(file, (progress) => { entry.progress = progress })
          const item = toItem(result, file)
          if (isMultiple.value) {
            current.push(item)
          } else {
            current.splice(0, current.length, item)
          }
          setFiles([...current])
        } catch (error: any) {
          uploadError.value = translate('files.uploadFailed', { message: error?.message || String(error) })
        } finally {
          pending.value = pending.value.filter((p) => p !== entry)
        }
      }
    }

    const removeFile = async (index: number) => {
      const item = files.value[index]
      if (!item) return
      setFiles(files.value.filter((_, i) => i !== index))
      uploadError.value = null
      try {
        if (hooks.value.remove) {
          await hooks.value.remove(item, context())
        } else if (options.value.deleteUrl && item.id && item.justUploaded) {
          await fetch(String(options.value.deleteUrl).replace('{id}', String(item.id)), {
            method: 'DELETE',
            headers: options.value.uploadHeaders || {},
          })
        }
      } catch (error) {
        console.error('File removal failed:', error)
      }
    }

    const downloadUrl = (item: FileItem): string | undefined => {
      if (hooks.value.downloadUrl) {
        return hooks.value.downloadUrl(item, context())
      }
      const template = options.value.downloadUrl
      if (typeof template === 'string' && template.length > 0) {
        return template.replace(/\{(\w+)\}/g, (match: string, key: string) => {
          const value = item[key]
          return value === undefined || value === null ? match : String(value)
        })
      }
      return item.url || item.href || undefined
    }

    const fileName = (item: FileItem): string => {
      const name = item.fileName || item.name || item.path
      return name ? String(name) : String(item)
    }

    const accept = computed<string | undefined>(() => {
      if (options.value.accept) return String(options.value.accept)
      const types = options.value.acceptedFileTypes
      if (Array.isArray(types)) return types.join(',')
      return types ? String(types) : undefined
    })

    return () => {
      if (!isVisible.value) {
        return null
      }

      const children = []

      if (title.value) {
        children.push(h('div', {
          class: (control.value.uischema as any).titleClass || 'text-bold',
          innerHTML: t(title.value) + requiredMark.value,
        }))
      }

      if (description.value) {
        children.push(h('div', {
          class: ((control.value.uischema as any).descriptionClass || 'text-grey-7') + ' text-markdown q-mb-sm',
          innerHTML: renderMarkdown(t(description.value)),
        }))
      }

      const items = files.value.map((item, index) => {
        const url = downloadUrl(item)
        const name = fileName(item)
        const size = formatFileSize(item.size)
        return h(QItem, { key: item.id || item.path || index, dense: true, class: 'q-file-item' }, () => [
          h(QItemSection, { avatar: true }, () => h(QIcon, { name: 'insert_drive_file', color: 'grey-7' })),
          h(QItemSection, {}, () => [
            url
              ? h('a', { href: url, target: '_blank', rel: 'noopener', class: 'q-file-item__name', title: translate('files.download') }, name)
              : h('span', { class: 'q-file-item__name', title: name }, name),
            size ? h('div', { class: 'text-caption text-grey-7' }, size) : null,
          ]),
          isReadonly.value ? null : h(QItemSection, { side: true }, () => h(QBtn, {
            flat: true,
            dense: true,
            round: true,
            size: 'sm',
            icon: 'delete',
            color: 'negative',
            title: translate('files.remove'),
            disable: !isEnabled.value,
            onClick: () => removeFile(index),
          })),
        ])
      })

      const uploads = pending.value.map((entry, index) => h(QItem, { key: `pending-${index}`, dense: true }, () => [
        h(QItemSection, { avatar: true }, () => h(QIcon, { name: 'cloud_upload', color: 'primary' })),
        h(QItemSection, {}, () => [
          h('span', { class: 'text-grey-7' }, entry.name),
          h(QLinearProgress, { value: entry.progress / 100, indeterminate: entry.progress === 0, size: 'xs', class: 'q-mt-xs' }),
        ]),
      ]))

      if (items.length > 0 || uploads.length > 0) {
        children.push(h(QList, { dense: true, class: 'q-file-list' }, () => [...items, ...uploads]))
      } else if (isReadonly.value) {
        const empty = options.value.emptyMessage ? t(String(options.value.emptyMessage)) : translate('files.empty')
        children.push(h('div', { class: 'text-grey-7 q-file-empty' }, empty))
      }

      if (!isReadonly.value) {
        children.push(h('input', {
          ref: fileInputRef,
          type: 'file',
          style: 'display: none',
          multiple: isMultiple.value,
          accept: accept.value,
          onChange: handleFileSelected,
          disabled: !isEnabled.value || !canAdd.value,
        }))

        if (canAdd.value) {
          children.push(h('div', { class: 'q-mt-sm' }, [
            h(QBtn, {
              label: label.value ? t(label.value) : translate('files.upload'),
              color: 'primary',
              icon: 'cloud_upload',
              size: 'sm',
              onClick: openFilePicker,
              disable: !isEnabled.value || pending.value.length > 0,
              loading: pending.value.length > 0,
              unelevated: true,
            }),
          ]))
        }

        if (uploadError.value) {
          children.push(h('div', { class: 'text-negative text-caption q-mt-sm' }, uploadError.value))
        }
      }

      const errors = [errorMessage.value, ...fileErrors.value].filter((e) => e && e.length > 0)
      if ((hasError.value || fileErrors.value.length > 0) && errors.length > 0) {
        children.push(h('div', { class: 'text-negative text-caption q-mt-xs q-file-errors' }, errors.join('; ')))
      }

      return h('div', { class: ['q-file-upload-renderer', rootClass.value] }, children)
    }
  },
})
