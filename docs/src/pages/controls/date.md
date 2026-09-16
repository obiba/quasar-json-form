---
title: Date
---

# Date

<p class="doc-lead">A string with <code>format: "date"</code>, <code>"datepicker"</code>, <code>"year-month"</code> or <code>"ymdatepicker"</code> renders an input with a <a href="https://quasar.dev/vue-components/date">QDate</a> popup.</p>

`format: "date"` stores an ISO date (`YYYY-MM-DD`) validated by AJV. `year-month` stores
`YYYY-MM` with a month picker.

<DocExample name="date/basic" title="Date and year-month" source />

## Mask and bounds

`datepicker` controls store the date in the `dateFormat` mask (`YYYY-MM-DD` by default; angular-strap
masks such as `dd/MM/yyyy` are accepted). `min` and `max`, as options or as [filtrex rules](#/start/rules)
naming another field, bound the value and the picker; the messages can be customized with
`validationMessage.dateMin` / `dateMax` / `dateRange` / `dateInvalid`. The options can also be
nested under `dateOptions`, as in angular-schema-form.

<DocExample name="date/mask-bounds" title="Mask, bound and bound from another field" />

## Year and month references

`ymdatepicker` ties the date to a year field and a month field (`yearRef` / `monthRef`, siblings
of the control or root fields). The input is disabled until both are set, the value defaults to the
first day of that month (`lastDay: true` for the last one) and follows them.

<DocExample name="date/year-month-ref" title="ymdatepicker" />

## API

<DocApi name="QDateRenderer" />
