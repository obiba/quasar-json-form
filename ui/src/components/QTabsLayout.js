import { h, computed, ref, defineComponent } from 'vue';
import { rendererProps } from '@jsonforms/vue';
import { DispatchRenderer } from '@jsonforms/vue';
import { QTabs, QTab, QTabPanels, QTabPanel, QSeparator } from 'quasar';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QTabsLayout',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();

    const withCategories = computed(() => props.uischema.type === 'Categorization');

    const elements = computed(() => {
      return (props.uischema.elements && Array.isArray(props.uischema.elements) ? props.uischema.elements : [])
    });
    const labels = computed(() => {
      if (withCategories.value) {
        return elements.value.map((category) => {
          return (category.label) ? category.label : 'Category';
        });
      }
      return (props.uischema.labels && Array.isArray(props.uischema.labels) && props.uischema.labels.length > 0)
        ? props.uischema.labels
        : elements.value.map((_, index) => `${index + 1}`);
    });
    const labelClass = computed(() => {
    return props.uischema.labelClass || '';
    });

    const currentTab = ref(labels.value.length > 0 ? '0' : null);

    return () => {
    return h('div', [
      h(QTabs, {
        modelValue: currentTab.value,
        'onUpdate:modelValue': (val) => currentTab.value = val,
        align: 'left',
        dense: true,
        activeColor: 'primary',
        indicatorColor: 'primary',
      }, () => labels.value.map((name, index) =>
        h(QTab, {
        name: String(index),
        label: t(name),
        class: labelClass.value,
        })
      )),
        h(QSeparator),
        h(QTabPanels, {
          modelValue: currentTab.value,
          'onUpdate:modelValue': (val) => currentTab.value = val,
          animated: false,
        }, () => elements.value.map((_, index) =>
          h(QTabPanel, {
            name: String(index),
          }, () => [
            h(DispatchRenderer, {
              schema: props.schema,
              uischema: elements.value[index],
              path: props.path,
              enabled: props.enabled,
              visible: props.visible,
              cells: props.cells,
              renderers: props.renderers,
              config: props.config,
            }),
          ])
        )),
      ]);
    };
  }
});