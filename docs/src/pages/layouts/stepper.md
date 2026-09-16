---
title: Stepper
---

# Stepper

<p class="doc-lead"><code>StepperLayout</code> renders one step per element with Continue and Back buttons.</p>

The step titles come from `labels` and the icons from `icons`, both optional. The navigation
buttons use the `continue` and `back` i18n keys of the application. The stepper does not block
navigation on validation errors: the form `errors` model tells whether the data is valid.

<DocExample name="layouts/stepper" title="Stepper" source />

## API

<DocApi name="QStepperLayout" />
