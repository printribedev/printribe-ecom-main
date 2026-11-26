import { beforeAll, describe, expect, it } from 'vitest'

import type { StudioArea } from '@/lib/studio/types'

const BASE = 'https://pub-test.r2.dev'
const area = (key: string, name = 'Chest'): StudioArea => ({
  key,
  name,
  size: 'small',
  x: 10,
  y: 10,
  width: 20,
  height: 20,
  sizeNote: '',
  widthIn: 4,
  heightIn: 4,
})
const areas = { front: [area('a1', 'Left chest'), area('a2', 'Front centre')], back: [area('b1', 'Full back')] }
const view = (objects: unknown[]) => JSON.stringify({ version: '7', objects })

let checkDesign: typeof import('@/lib/studio/validate').checkDesign

beforeAll(async () => {
  process.env.R2_PUBLIC_URL = BASE
  ;({ checkDesign } = await import('@/lib/studio/validate'))
})

describe('studio design safety check (what the server accepts from the browser)', () => {
  it('accepts text and our own uploaded images inside real print areas, and lists the areas used', () => {
    const r = checkDesign(
      {
        front: view([
          { type: 'Textbox', text: 'Club', areaKey: 'a1' },
          { type: 'Image', src: `${BASE}/designs/uploads/abc.png`, areaKey: 'a2' },
        ]),
      },
      areas,
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.design.used.map((u) => u.areaKey).sort()).toEqual(['a1', 'a2'])
      expect(r.design.files).toEqual([`${BASE}/designs/uploads/abc.png`])
    }
  })

  it('refuses images from anywhere but our own upload folder', () => {
    expect(checkDesign({ front: view([{ type: 'Image', src: 'https://evil.example.com/x.png', areaKey: 'a1' }]) }, areas).ok).toBe(false)
    expect(checkDesign({ front: view([{ type: 'Image', src: `${BASE}/other/x.png`, areaKey: 'a1' }]) }, areas).ok).toBe(false)
    expect(checkDesign({ front: view([{ type: 'Image', src: `${BASE}/designs/uploads/../../secret.png`, areaKey: 'a1' }]) }, areas).ok).toBe(false)
  })

  it('refuses elements outside the print areas, unknown sides and unknown element types', () => {
    expect(checkDesign({ front: view([{ type: 'Textbox', text: 'x', areaKey: 'nope' }]) }, areas).ok).toBe(false)
    expect(checkDesign({ front: view([{ type: 'Textbox', text: 'x', areaKey: 'b1' }]) }, areas).ok).toBe(false) // a back area on the front
    expect(checkDesign({ sleeve: view([{ type: 'Textbox', text: 'x', areaKey: 'a1' }]) }, areas).ok).toBe(false)
    expect(checkDesign({ front: view([{ type: 'Rect', areaKey: 'a1' }]) }, areas).ok).toBe(false)
  })

  it('refuses oversized, broken or empty designs', () => {
    expect(checkDesign({ front: view([{ type: 'Textbox', text: 'x'.repeat(501), areaKey: 'a1' }]) }, areas).ok).toBe(false)
    expect(checkDesign({ front: view(Array.from({ length: 51 }, () => ({ type: 'Textbox', text: 'x', areaKey: 'a1' }))) }, areas).ok).toBe(false)
    expect(checkDesign({ front: 'not json' }, areas).ok).toBe(false)
    expect(checkDesign({ front: view([]) }, areas).ok).toBe(false)
    expect(checkDesign(null, areas).ok).toBe(false)
  })
})
