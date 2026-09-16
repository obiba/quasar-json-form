---
title: Group
---

# Group

<p class="doc-lead">A <code>Group</code> is a titled block of elements, with an optional description and hint.</p>

The `label` (JSON Forms convention, `title` is accepted too), `description` and `hint` are
translated with vue-i18n and rendered as markdown. A `Category` inside a
[Categorization](/#/layouts/tabs) renders the same way, without the title.

<DocExample name="layouts/group" title="Groups" source />

## API

<DocApi name="QGroupRenderer" />
