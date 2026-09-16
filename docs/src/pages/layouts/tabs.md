---
title: Tabs
---

# Tabs

<p class="doc-lead">A JSON Forms <code>Categorization</code> renders its <code>Category</code> elements as tabs.</p>

The tab label is the `label` of the category, translated with vue-i18n. Each category renders as a
[Group](/#/layouts/group) without a title, so its `description` and `hint` are displayed. Rules on
a control inside a tab work as anywhere else.

<DocExample name="layouts/categorization" title="Categorization" source />

## TabsLayout

`TabsLayout` is a lighter form: one tab per element, labelled by the `labels` array (or numbered).

<DocExample name="layouts/tabs" title="TabsLayout" />

## API

<DocApi name="QTabsLayout" />
