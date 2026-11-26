import { describe, expect, it } from 'vitest'

import { hashPassword, validatePassword, verifyPassword } from '@/lib/account/password'
import { safeNext } from '@/lib/account/next'
import { sentenceFrom } from '@/lib/contact/options'
import { normalizePhone, validateEmail, validateName, validatePhone } from '@/lib/shop/validation'

describe('customer details checks (fake entries are refused)', () => {
  it('accepts real names and refuses fake ones', () => {
    expect(validateName('Priya Nair')).toBeNull()
    expect(validateName('Meera Krishnamurthy')).toBeNull()
    expect(validateName('Priya')).not.toBeNull() // first name only
    expect(validateName('asdf asdf')).not.toBeNull()
    expect(validateName('Test Test')).not.toBeNull()
    expect(validateName('123 456')).not.toBeNull()
  })

  it('accepts Indian mobile numbers in common formats and refuses fake ones', () => {
    expect(validatePhone('9845012345')).toBeNull()
    expect(validatePhone('+91 98450 12345')).toBeNull()
    expect(normalizePhone('+91 98450-12345')).toBe('9845012345')
    expect(validatePhone('1234567890')).not.toBeNull() // does not start with 6 to 9
    expect(validatePhone('9999999999')).not.toBeNull() // one repeated digit
    expect(validatePhone('9876543210')).not.toBeNull() // a straight run
    expect(validatePhone('98450')).not.toBeNull()
  })

  it('accepts real emails and refuses throw-away or made-up ones', () => {
    expect(validateEmail('priya.nair@gmail.com')).toBeNull()
    expect(validateEmail('not-an-email')).not.toBeNull()
    expect(validateEmail('x@y.z')).not.toBeNull()
    expect(validateEmail('someone@mailinator.com')).not.toBeNull()
  })
})

describe('passwords', () => {
  it('stores a one-way hash and checks it correctly', async () => {
    const hash = await hashPassword('Sunrise-Table-42')
    expect(hash).not.toContain('Sunrise')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('Sunrise-Table-42', hash)).toBe(true)
    expect(await verifyPassword('sunrise-table-42', hash)).toBe(false)
    expect(await verifyPassword('', hash)).toBe(false)
  })

  it('uses a different salt every time, so equal passwords give different hashes', async () => {
    expect(await hashPassword('Orange-River-77')).not.toBe(await hashPassword('Orange-River-77'))
  })

  it('refuses a damaged stored hash instead of letting anyone in', async () => {
    expect(await verifyPassword('anything', 'not-a-hash')).toBe(false)
    expect(await verifyPassword('anything', 'scrypt$$')).toBe(false)
  })

  it('refuses weak passwords', () => {
    expect(validatePassword('short')).not.toBeNull()
    expect(validatePassword('password123')).not.toBeNull()
    expect(validatePassword('aaaaaaaaaa')).not.toBeNull()
    expect(validatePassword('priya@gmail.com', 'priya@gmail.com')).not.toBeNull()
    expect(validatePassword('Sunrise-Table-42')).toBeNull()
  })
})

describe('where a customer can be sent after signing in', () => {
  it('only allows pages on this website', () => {
    expect(safeNext('/checkout?design=abc')).toBe('/checkout?design=abc')
    expect(safeNext('/account')).toBe('/account')
    expect(safeNext('https://evil.example.com')).toBe('/account')
    expect(safeNext('//evil.example.com')).toBe('/account')
    expect(safeNext('/\\evil.example.com')).toBe('/account')
    expect(safeNext(undefined)).toBe('/account')
    expect(safeNext('')).toBe('/account')
  })
})

describe('the Contact page sentence', () => {
  it('builds a readable message from the chosen blanks', () => {
    const text = sentenceFrom(
      'Meera Krishnan',
      { what: 'hoodies', need: 'my college', quantity: '51 to 100', neededBy: 'within 2 weeks', bestTime: 'in the evening' },
      'Our club logo is attached.',
    )
    expect(text).toBe("Hi, I'm Meera Krishnan. I'd like hoodies for my college, about 51 to 100 pieces, needed within 2 weeks. Please contact me in the evening. Our club logo is attached.")
  })

  it('still reads well when nothing else is chosen', () => {
    expect(sentenceFrom('Meera Krishnan', {})).toBe("Hi, I'm Meera Krishnan. I'd like to talk about an order.")
  })
})
