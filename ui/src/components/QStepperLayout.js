import { h, computed, ref, defineComponent } from 'vue';
import { rendererProps } from '@jsonforms/vue';
import { DispatchRenderer } from '@jsonforms/vue';
import { QStepper, QStep, QStepperNavigation, QBtn } from 'quasar';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QStepperLayout',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();
    const elements = computed(() => (props.uischema.elements && Array.isArray(props.uischema.elements) ? props.uischema.elements : []));
    const labels = computed(() => {
    return (props.uischema.labels && Array.isArray(props.uischema.labels) && props.uischema.labels.length > 0)
      ? props.uischema.labels
      : elements.value.map((_, index) => `${index + 1}`);
    });
    const labelClass = computed(() => {
      return props.uischema.labelClass || '';
    });
    const icons = computed(() => {
      return (props.uischema.icons && Array.isArray(props.uischema.icons) && props.uischema.icons.length === elements.value.length)
        ? props.uischema.icons
        : null;
    });

    const currentStep = ref(0);

    const steps = () => labels.value.map((name, index) =>
      h(QStep, {
      name: index,
      title: t(name),
      icon: icons.value ? icons.value[index] : undefined,
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
      );
    const navigation = () => {
      const children = [];

      if (currentStep.value < elements.value.length - 1) {
        children.push(
          h(QBtn, {
            label: t('continue'),
            color: 'primary',
            noCaps: true,
            class: 'text-capitalize on-left',
            onClick: () => currentStep.value += 1,
          })
        );
      }
    
      if (currentStep.value > 0) {
        children.push(
          h(QBtn, {
            label: t('back'),
            flat: true,
            noCaps: true,
            class: 'text-capitalize',
            onClick: () => currentStep.value -= 1,
          })
        );
      }
      
      return h(QStepperNavigation, {}, () => children);
    };

    return () => {
    return h('div', [
      h(QStepper, {
        modelValue: currentStep.value,
        'onUpdate:modelValue': (val) => { currentStep.value = val; },
        flat: true,
        color: 'primary',
        class: labelClass.value,
      }, 
      {default: steps, navigation})
    ]);
    };
  }
});