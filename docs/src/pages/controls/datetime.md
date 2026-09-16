---
title: Date and time
---

# Date and time

<p class="doc-lead">A string with <code>format: "date-time"</code> renders an input with a date picker and a time picker.</p>

`date-time` stores `YYYY-MM-DD HH:mm`; `date-fulltime` adds the seconds. AJV validates
`date-time` as the pickers store it (a `T` separator, seconds and timezone are also accepted).

<DocExample name="datetime/basic" title="Date-time and date-fulltime" source />

## API

<DocApi name="QDateTimeRenderer" />
