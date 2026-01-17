import { h, watch, defineComponent, ref } from 'vue';
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

    const { isVisible, isEnabled, options, title, description, label, hint } =
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

      const uploadUrl = options.value.uploadUrl;
      const uploadMethod = options.value.uploadMethod || 'POST';
      const uploadHeaders = options.value.uploadHeaders || {};
      const pathKey = options.value.pathKey || 'path';

      if (!uploadUrl) {
        uploadError.value = t('errors.upload_url_missing');
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

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error('Invalid JSON response from upload server');
        }
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

      if (title.value) {
        const titleText = t(title.value);
        children.push(h('div', {
          class: control.value.uischema.titleClass || 'text-bold',
          innerHTML: titleText,
        }));
      }

      if (description.value) {
        const descriptionText = renderMarkdown(t(description.value));
        children.push(h('div', {
          class: (control.value.uischema.descriptionClass || 'text-grey-7') + ' text-markdown q-mb-sm',
          innerHTML: descriptionText,
        }));
      }

      if (control.value.data) {
        const path = control.value.data;
        // Max length for display
        const maxLength = 50;
        const displayPath = path.length > maxLength ? path.slice(0, maxLength) + '...' : path;
        const qItem = h(QItem, {}, [
          isEnabled.value ? h(QItemSection, {
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
          ]) : null,
          h(QItemSection, {
            class: 'text-caption text-grey-7',
            title: path.replaceAll('\n', ''),
          }, displayPath),
        ]);
        children.push(h(QList, {
          bordered: false,
          dense: true,
        }, [qItem]));
      }


      // File picker button with loading progress
      if (control.value.data === undefined) {
        // Hidden file input
        children.push(h('input', {
          ref: fileInputRef,
          type: 'file',
          style: 'display: none',
          onChange: handleFileSelected,
          disabled: !isEnabled.value || isLoading.value,
          accept: (() => {
            if (options.value.accept) {
              return options.value.accept;
            }
            if (options.value.acceptedFileTypes) {
              const types = options.value.acceptedFileTypes;
              if (Array.isArray(types)) {
                return types.join(',');
              }
              return types;
            }
            return undefined;
          })(),
        }));

        children.push(h('div', { class: 'q-mt-sm' }, [
          h(QBtn, {
            label: label.value ? t(label.value) : undefined,
            color: 'primary',
            icon: 'cloud_upload',
            size: 'sm',
            onClick: openFilePicker,
            disable: !isEnabled.value || isLoading.value,
            loading: isLoading.value,
            unelevated: true,
          }),
        ]));

        if (hint.value) {
          const hintText = t(hint.value);
          children.push(h('div', {
            class: 'text-hint text-grey-7 q-mt-sm',
          }, hintText));
        }
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