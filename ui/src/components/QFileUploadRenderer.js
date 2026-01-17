import { h, watch, defineComponent, ref, computed } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QBtn, QList, QItem, QItemSection } from 'quasar';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';
import { renderMarkdown } from '../utils/markdown';

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
};

export default defineComponent({
  name: 'QFileUploadRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    const { isVisible, isEnabled, uiOptions } =
      useControlProperties(control);

    const fileInputRef = ref();
    const isLoading = ref(false);
    const uploadError = ref(null);

    const openFilePicker = () => {
      fileInputRef.value?.click();
    };

    const handleFileSelected = (event) => {
      const file = event.target.files?.[0];
      if (file) {
        uploadFile(file);
      }
      // Reset input so same file can be selected again
      event.target.value = '';
    };

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onClear();
        }
      },
    );

    const onClear = () => {
      controlResult.handleChange(control.value.path, undefined);
      uploadError.value = null;
    };

    const uploadFile = async (file) => {
      if (!file) {
        onClear();
        return;
      }

      const uploadUrl = uiOptions.value.uploadUrl;
      const uploadMethod = uiOptions.value.uploadMethod || 'POST';
      const uploadHeaders = uiOptions.value.uploadHeaders || {};
      const pathKey = uiOptions.value.pathKey || 'path';

      if (!uploadUrl) {
        uploadError.value = t('errors.upload_url_missing') || 'Upload URL is not configured';
        return;
      }

      isLoading.value = true;
      uploadError.value = null;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(uploadUrl, {
          method: uploadMethod,
          headers: uploadHeaders,
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        const data = await response.json();
        const remotePath = getNestedValue(data, pathKey);

        if (!remotePath) {
          throw new Error(`Response does not contain ${pathKey} field`);
        }

        controlResult.handleChange(control.value.path, remotePath);
      } catch (error) {
        uploadError.value = error.message;
      } finally {
        isLoading.value = false;
      }
    };

    return () => {
      if (!isVisible.value) {
        return null;
      }

      const children = [];

      if (control.value.schema.title || control.value.uischema.title) {
        let title = t(control.value.schema.title || control.value.uischema.title);
        children.push(h('div', {
          class: control.value.uischema.titleClass || 'text-bold',
          innerHTML: title,
        }));
      }

      if (control.value.description || control.value.uischema.description) {
        let hint = t(control.value.description || control.value.uischema.description);
        hint = renderMarkdown(hint);
        children.push(h('div', {
          class: (control.value.uischema.descriptionClass || 'text-grey-7') + ' text-markdown',
          innerHTML: hint,
        }));
      }

      if (control.value.data) {
        const path = control.value.data;
        // Max length for display
        const maxLength = 50;
        const displayPath = path.length > maxLength ? path.substr(0, maxLength) + '...' : path;
        const qItem = h(QItem, {}, [
          h(QItemSection, {
            class: 'text-caption text-grey-7',
            title: path.replaceAll('\n', ''),
          }, displayPath),
          h(QItemSection, {
            class: 'q-ml-sm q-mb-xs',
            avatar: true,
          }, [
            h(QBtn, {
              flat: true,
              dense: true,
              rounded: true,
              size: 'sm',
              icon: 'close',
              color: 'negative',
              onClick: onClear,
              disable: isLoading.value || !isEnabled.value,
            }),
          ]),
        ]);
        children.push(h(QList, {
          class: 'q-mt-sm',
          bordered: true,
        }, [qItem]));
      }

      // Hidden file input
      children.push(h('input', {
        ref: fileInputRef,
        type: 'file',
        style: 'display: none',
        onChange: handleFileSelected,
        disabled: !isEnabled.value || isLoading.value,
      }));

      // File picker button with loading progress
      children.push(h('div', { class: 'q-mt-sm' }, [
        h(QBtn, {
          label: control.value.schema.label ? t(control.value.schema.label): undefined,
          color: 'primary',
          icon: 'cloud_upload',
          size: 'sm',
          onClick: openFilePicker,
          disable: !isEnabled.value || isLoading.value,
          loading: isLoading.value,
          unelevated: true,
        }),
      ]));

      if (control.value.description || control.value.uischema.description) {
        const hint = t(control.value.description || control.value.uischema.description);
        children.push(h('div', {
          class: 'text-hint text-caption text-grey-7 q-mt-sm',
        }, t(hint)));
      }

      if (uploadError.value) {
        children.push(h('div', {
          class: 'text-negative q-mt-md',
        }, uploadError.value));
      }
      return h('div', { class: 'q-file-renderer' }, children);
    };
  },
});