/**
 * Rules that keep dummy or gibberish details ("ABC", "9545", "askfjkhds@vdgdf") out of orders.
 * The form uses them for instant feedback and the server uses the same ones (the server enforces them).
 * Each returns a plain-English message, or null if the value is fine.
 * Ported from the old project's validation (49 test cases passed there).
 */
type Result = string | null

const BLOCKED_WORDS = new Set([
  'test', 'testing', 'abc', 'abcd', 'abcde', 'abcdef', 'xyz', 'asdf', 'asdfg', 'asdfgh', 'qwerty',
  'dummy', 'fake', 'sample', 'demo', 'none', 'null', 'name', 'xxx', 'aaa', 'na', 'lorem', 'ipsum',
  'address', 'city', 'random', 'nothing',
])

const KEYBOARD_MASH =
  /(asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwer|wert|erty|rtyu|tyui|yuio|uiop|zxcv|xcvb|cvbn|vbnm|abcd|qazw|wsxe)/

const DISPOSABLE_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'test.in', 'mailinator.com', 'yopmail.com',
  'guerrillamail.com', 'sharklasers.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'trashmail.com', 'dispostable.com', 'getnada.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com',
])

const LETTERS = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u

function looksLikeMash(word: string): boolean {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length < 3) return false
  if (/(.)\1{3,}/.test(w)) return true
  if (/[^aeiouy]{6,}/.test(w)) return true
  return KEYBOARD_MASH.test(w)
}

const wordsOf = (s: string) => s.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean)

function looksFake(text: string): boolean {
  const words = wordsOf(text)
  if (words.some((w) => BLOCKED_WORDS.has(w.toLowerCase()))) return true
  if (words.some(looksLikeMash)) return true
  const letters = text.toLowerCase().replace(/[^\p{L}]/gu, '')
  return letters.length > 0 && new Set(letters).size === 1
}

export function validateName(raw: string): Result {
  const name = raw.trim().replace(/\s+/g, ' ')
  if (!LETTERS.test(name)) return 'Please use letters only in your name.'
  const words = name.split(' ')
  if (words.length < 2) return 'Please enter your full name (first and last name).'
  const letterCount = name.replace(/[^\p{L}]/gu, '').length
  if (letterCount < 4 || !words.some((w) => w.replace(/[^\p{L}]/gu, '').length >= 3))
    return 'Please enter your full name (first and last name).'
  if (looksFake(name) || new Set(words.map((w) => w.toLowerCase())).size === 1)
    return 'That name does not look real. Please enter your real name.'
  return null
}

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s()-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '')
}

export function validatePhone(raw: string): Result {
  const d = normalizePhone(raw)
  if (!/^[6-9]\d{9}$/.test(d)) return 'Enter a valid 10-digit Indian mobile number.'
  const fake = 'That phone number does not look real. Please enter your real number.'
  if (new Set(d).size < 4) return fake
  if (/^(\d{2})\1{4}$/.test(d) || /^(\d{5})\1$/.test(d)) return fake
  let up = 1
  let down = 1
  for (let i = 1; i < d.length; i++) {
    const diff = Number(d[i]) - Number(d[i - 1])
    up = diff === 1 ? up + 1 : 1
    down = diff === -1 ? down + 1 : 1
    if (up >= 7 || down >= 7) return fake
  }
  return null
}

export function validateEmail(raw: string): Result {
  const email = raw.trim().toLowerCase()
  if (!/^[a-z0-9._%+-]+@([a-z0-9-]+\.)+[a-z]{2,}$/.test(email)) return 'Enter a valid email address.'
  const [local, domain] = email.split('@')
  if (local.length < 3) return 'Enter a valid email address.'
  if (DISPOSABLE_DOMAINS.has(domain)) return 'Please use a real email address, not a temporary one.'
  const labels = domain.split('.')
  if (looksFake(local) || labels.slice(0, -1).some(looksLikeMash))
    return 'That email does not look real. Please enter your real email.'
  return null
}

export function validateAddressLine1(raw: string): Result {
  const a = raw.trim().replace(/\s+/g, ' ')
  const letters = a.replace(/[^\p{L}]/gu, '').length
  if (a.length < 8 || letters < 4 || a.split(' ').length < 2)
    return 'Enter your full address: house or flat number, building and street.'
  if (looksFake(a)) return 'That address does not look real. Please enter your real address.'
  return null
}

export function validateAddressLine2(raw: string): Result {
  const a = raw.trim()
  if (!a) return null
  return looksFake(a) ? 'That does not look real. Please enter a real landmark or area, or leave it empty.' : null
}

export function validateCity(raw: string): Result {
  const c = raw.trim().replace(/\s+/g, ' ')
  if (!LETTERS.test(c) || c.replace(/[^\p{L}]/gu, '').length < 3) return 'Enter your city or town.'
  if (looksFake(c)) return 'That city does not look real. Please enter your real city.'
  return null
}

export function validatePincode(raw: string): Result {
  const p = raw.trim()
  if (!/^[1-9]\d{5}$/.test(p)) return 'Enter a valid 6-digit pincode.'
  if (new Set(p).size === 1 || p === '123456' || p === '654321' || p === '121212')
    return 'That pincode does not look real. Please enter your real pincode.'
  return null
}

export type DetailsInput = {
  name: string
  phone: string
  email: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
}

/** Runs every field rule. Returns messages keyed by field name (empty object = all good). */
export function validateDetails(d: DetailsInput): Partial<Record<keyof DetailsInput, string>> {
  const checks: [keyof DetailsInput, Result][] = [
    ['name', validateName(d.name)],
    ['phone', validatePhone(d.phone)],
    ['email', validateEmail(d.email)],
    ['line1', validateAddressLine1(d.line1)],
    ['line2', validateAddressLine2(d.line2 ?? '')],
    ['city', validateCity(d.city)],
    ['state', d.state ? null : 'Choose your state.'],
    ['pincode', validatePincode(d.pincode)],
  ]
  return Object.fromEntries(checks.filter(([, e]) => e)) as Partial<Record<keyof DetailsInput, string>>
}

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh',
  'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
]
