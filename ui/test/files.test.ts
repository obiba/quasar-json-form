import { describe, it, expect, vi, afterEach } from 'vitest'
import { mountForm, flush } from './utils'

const schema = {
  type: 'object',
  properties: {
    docs: { type: 'object', format: 'obibaFiles', title: 'Documents' },
    attachments: { type: 'array', format: 'files', title: 'Attachments', items: { type: 'object' } },
    file: { type: 'string', format: 'file', title: 'File' },
  },
  required: ['docs'],
}

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const lastErrors = (wrapper: any) => {
  const emitted = wrapper.emitted('update:errors')!
  return emitted[emitted.length - 1]![0] as any[]
}

const selectFiles = async (wrapper: any, files: File[]) => {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: files, configurable: true })
  await input.trigger('change')
  // let the (async) upload settle
  for (let i = 0; i < 5; i++) {
    await flush()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

describe('file upload', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('lists the files of an object control read-only', async () => {
    const wrapper = mountForm({
      schema,
      readonly: true,
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/docs', options: { downloadUrl: '/ws/files/{id}/{fileName}' } }] },
      modelValue: { docs: { obibaFiles: [{ id: '1', fileName: 'a.pdf', size: 2048 }, { id: '2', fileName: 'b.txt', size: 10 }] } },
    })
    await flush()
    const items = wrapper.findAll('.q-file-item')
    expect(items.length).toBe(2)
    expect(items[0]!.find('.q-file-item__name').text()).toBe('a.pdf')
    expect(items[0]!.find('a').attributes('href')).toBe('/ws/files/1/a.pdf')
    expect(items[0]!.find('.text-caption').text()).toBe('2.0 KB')
    expect(wrapper.find('.q-btn').exists()).toBe(false)
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows the empty message read-only', async () => {
    const wrapper = mountForm({
      schema,
      readonly: true,
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/docs', options: { emptyMessage: 'no-docs' } }] },
      modelValue: { docs: { obibaFiles: [] } },
    })
    await flush()
    expect(wrapper.find('.q-file-empty').text()).toBe('no-docs')
    wrapper.unmount()
  })

  it('removes a file and reports the required error', async () => {
    const wrapper = mountForm({ schema, modelValue: { docs: { obibaFiles: [{ id: '1', fileName: 'a.pdf' }] } } })
    await flush()
    await wrapper.find('.q-file-item .q-btn').trigger('click')
    await flush()
    expect(lastData(wrapper).docs).toEqual({ obibaFiles: [] })
    expect(wrapper.find('.q-file-errors').text()).toBe('At least one file is required')
    expect(lastErrors(wrapper).map((e) => [e.keyword, e.instancePath])).toEqual([['files', '/docs']])
    wrapper.unmount()
  })

  it('validates minItems on an object control with the validationMessage option', async () => {
    const wrapper = mountForm({
      schema: { ...schema, properties: { docs: { ...schema.properties.docs, minItems: 2 } } },
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/docs', options: { validationMessage: { minItems: 'need-two' } } }] },
      modelValue: { docs: { obibaFiles: [{ id: '1', fileName: 'a.pdf' }] } },
    })
    await flush()
    expect(wrapper.find('.q-file-errors').text()).toBe('need-two')
    wrapper.unmount()
  })

  it('uploads through the config hook and stores the returned item', async () => {
    const upload = vi.fn(async (file: File) => ({ id: 'x', fileName: file.name, size: file.size, md5: 'm' }))
    const wrapper = mountForm({ schema, config: { fileUpload: { upload } }, modelValue: { docs: { obibaFiles: [] } } })
    await flush()
    await selectFiles(wrapper, [new File(['hello'], 'a.txt'), new File(['hi'], 'b.txt')])
    expect(upload).toHaveBeenCalledTimes(2)
    expect(lastData(wrapper).docs.obibaFiles).toEqual([
      { id: 'x', fileName: 'a.txt', size: 5, md5: 'm', justUploaded: true },
      { id: 'x', fileName: 'b.txt', size: 2, md5: 'm', justUploaded: true },
    ])
    wrapper.unmount()
  })

  it('uploads with XHR, reads the Location header and fetches the metadata', async () => {
    const requests: any[] = []
    class FakeXhr {
      status = 201
      responseText = ''
      upload = { onprogress: null as any }
      onload: any = null
      onerror: any = null
      headers: Record<string, string> = {}
      open(method: string, url: string) { requests.push({ method, url }) }
      setRequestHeader(name: string, value: string) { this.headers[name] = value }
      getResponseHeader(name: string) { return name === 'Location' ? 'http://localhost/ws/files/temp/abc' : null }
      send(body: FormData) {
        requests[requests.length - 1].body = body
        setTimeout(() => this.onload(), 0)
      }
    }
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    const fetchMock = vi.fn(async (url: string) => ({ ok: true, json: async () => ({ id: 'abc', fileName: 'a.txt', size: 5, md5: 'z', url }) }))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [{
          type: 'Control',
          scope: '#/properties/docs',
          options: { uploadUrl: '/ws/files/temp', metadataUrl: '/ws/files/temp/{id}', uploadHeaders: { 'X-Token': 't' } },
        }],
      },
      modelValue: {},
    })
    await flush()
    await selectFiles(wrapper, [new File(['hello'], 'a.txt')])
    expect(requests[0].method).toBe('POST')
    expect(requests[0].url).toBe('/ws/files/temp')
    expect(requests[0].body.get('file')).toBeInstanceOf(File)
    expect(fetchMock).toHaveBeenCalledWith('/ws/files/temp/abc', expect.anything())
    expect(lastData(wrapper).docs.obibaFiles).toEqual([
      { id: 'abc', fileName: 'a.txt', size: 5, md5: 'z', url: '/ws/files/temp/abc', justUploaded: true },
    ])
    wrapper.unmount()
  })

  it('deletes a just uploaded file on the server', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mountForm({
      schema,
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/docs', options: { deleteUrl: '/ws/files/temp/{id}' } }] },
      modelValue: { docs: { obibaFiles: [{ id: '1', fileName: 'a.pdf' }, { id: '2', fileName: 'b.pdf', justUploaded: true }] } },
    })
    await flush()
    await wrapper.findAll('.q-file-item .q-btn')[1]!.trigger('click')
    await flush()
    expect(fetchMock).toHaveBeenCalledWith('/ws/files/temp/2', expect.objectContaining({ method: 'DELETE' }))
    await wrapper.findAll('.q-file-item .q-btn')[0]!.trigger('click')
    await flush()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('stores a list for an array control and drops it when emptied', async () => {
    const wrapper = mountForm({ schema, modelValue: { attachments: [{ id: '1', fileName: 'a.pdf' }] } })
    await flush()
    const renderer = wrapper.findAll('.q-file-upload-renderer')[1]!
    await renderer.find('.q-file-item .q-btn').trigger('click')
    await flush()
    expect(lastData(wrapper).attachments).toBeUndefined()
    wrapper.unmount()
  })

  it('keeps the single path behaviour of string controls', async () => {
    const wrapper = mountForm({ schema, modelValue: { file: '/tmp/x.txt' } })
    await flush()
    const renderer = wrapper.findAll('.q-file-upload-renderer')[2]!
    expect(renderer.find('.q-file-item__name').text()).toBe('/tmp/x.txt')
    // a single file: no upload button until it is removed
    expect(renderer.findAll('.q-btn').length).toBe(1)
    await renderer.find('.q-file-item .q-btn').trigger('click')
    await flush()
    expect(lastData(wrapper).file).toBeUndefined()
    wrapper.unmount()
  })
})
