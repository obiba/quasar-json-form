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
        const labels = computed(() => {
            return props.uischema.labels?.length > 0
                ? props.uischema.labels
                : props.uischema.elements.map((_, index) => `${index + 1}`);
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
                        noCaps: true,
                        class: labelClass.value,
                    })
                )),
                h(QSeparator),
                h(QTabPanels, {
                    modelValue: currentTab.value,
                    'onUpdate:modelValue': (val) => currentTab.value = val,
                    animated: false,
                }, () => props.uischema.elements.map((_, index) =>
                    h(QTabPanel, {
                        name: String(index),
                    }, [
                        h(DispatchRenderer, {
                            schema: props.schema,
                            uischema: props.uischema.elements[index],
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