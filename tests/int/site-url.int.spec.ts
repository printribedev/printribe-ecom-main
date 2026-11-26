import { describe, expect, it } from 'vitest'

import { normalizeSiteUrl } from '@/utilities/getURL'

describe('website address setting', () => {
  it('keeps a correct address as it is', () => {
    expect(normalizeSiteUrl('https://www.printribe.in')).toBe('https://www.printribe.in')
    expect(normalizeSiteUrl('http://localhost:3001')).toBe('http://localhost:3001')
  })

  it('fixes the usual typing mistakes instead of breaking the site', () => {
    expect(normalizeSiteUrl('www.printribe.in')).toBe('https://www.printribe.in') // no https://
    expect(normalizeSiteUrl('https://www.printribe.in/')).toBe('https://www.printribe.in') // trailing slash
    expect(normalizeSiteUrl('  https://www.printribe.in  ')).toBe('https://www.printribe.in') // spaces
    expect(normalizeSiteUrl('"https://www.printribe.in"')).toBe('https://www.printribe.in') // quotes
    expect(normalizeSiteUrl('https://www.printribe.in/shop?x=1')).toBe('https://www.printribe.in') // keeps only the address
    expect(normalizeSiteUrl('localhost:3001')).toBe('http://localhost:3001')
  })

  it('returns nothing for an empty or hopeless value', () => {
    expect(normalizeSiteUrl('')).toBe('')
    expect(normalizeSiteUrl(undefined)).toBe('')
    expect(normalizeSiteUrl('https://')).toBe('')
  })
})
