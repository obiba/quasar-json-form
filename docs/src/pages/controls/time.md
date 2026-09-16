---
title: Time
---

# Time

<p class="doc-lead">A string with <code>format: "time"</code> renders an input with a <a href="https://quasar.dev/vue-components/time">QTime</a> popup.</p>

`time` stores `HH:mm`; `fulltime` stores `HH:mm:ss` and shows the seconds in the picker. AJV
validates `time` as the picker stores it (seconds and timezone optional).

<DocExample name="time/basic" title="Time and fulltime" source />

## API

<DocApi name="QTimeRenderer" />
