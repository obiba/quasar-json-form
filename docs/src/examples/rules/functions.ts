// A boot file of the application: the functions are registered once, before
// any form is rendered, and are then available to every rule.
import { ruleEngine } from 'ui'

// age(date): years elapsed since an ISO date, undefined when it is not a date
ruleEngine.addFunction('age', (date: unknown) => {
  const birth = new Date(String(date ?? ''))
  if (isNaN(birth.getTime())) return undefined
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const beforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  return beforeBirthday ? years - 1 : years
})

// luhn(number): checksum of credit card and SIREN / SIRET numbers
ruleEngine.addFunction('luhn', (value: unknown) => {
  const digits = String(value ?? '').replace(/\s/g, '')
  if (!/^\d+$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2
    sum += digit
  }
  return sum % 10 === 0
})
