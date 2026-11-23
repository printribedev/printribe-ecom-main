import type { StudioArea } from './types'
import { publicBase, UPLOAD_PREFIX } from './r2'

/**
 * Server-side checks for a design sent by the browser. Nothing from the browser is trusted:
 * every element must belong to a real print area of this product, images must be files WE stored, and sizes are capped.
 */

const MAX_VIEW_JSON = 2_000_000
const MAX_OBJECTS_PER_VIEW = 50
const MAX_TEXT = 500

export type CleanDesign = {
  views: Record<string, { version?: string; objects: Record<string, unknown>[] }>
  used: { view: string; areaKey: string; areaName: string; size: string }[]
  files: string[]
}

export function checkDesign(
  input: unknown,
  allowed: Record<string, StudioArea[]>,
): { ok: true; design: CleanDesign } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'No design was sent.' }
  const views: CleanDesign['views'] = {}
  const used = new Map<string, CleanDesign['used'][number]>()
  const files = new Set<string>()
  const imageBase = `${publicBase()}/${UPLOAD_PREFIX}`

  for (const [view, raw] of Object.entries(input as Record<string, unknown>)) {
    const areas = allowed[view]
    if (!areas) return { ok: false, error: 'This design has a side the product does not have.' }
    if (typeof raw !== 'string' || raw.length > MAX_VIEW_JSON) return { ok: false, error: 'The design is too large.' }
    let parsed: { version?: string; objects?: unknown }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ok: false, error: 'The design could not be read.' }
    }
    const objects = Array.isArray(parsed.objects) ? (parsed.objects as Record<string, unknown>[]) : []
    if (objects.length > MAX_OBJECTS_PER_VIEW) return { ok: false, error: 'Too many elements on one side.' }
    if (objects.length === 0) continue

    for (const o of objects) {
      const type = String(o.type || '').toLowerCase()
      const area = areas.find((a) => a.key === o.areaKey)
      if (!area) return { ok: false, error: 'An element is outside the print areas.' }
      if (type === 'textbox') {
        if (typeof o.text !== 'string' || o.text.length > MAX_TEXT) return { ok: false, error: 'A text element is too long.' }
      } else if (type === 'image') {
        const src = o.src
        if (typeof src !== 'string' || src.length > 600 || !src.startsWith(imageBase) || src.includes('..')) {
          return { ok: false, error: 'An image was not uploaded properly. Please add it again.' }
        }
        files.add(src)
      } else {
        return { ok: false, error: 'This design has an element that is not allowed.' }
      }
      used.set(area.key, { view, areaKey: area.key, areaName: area.name, size: area.size })
    }
    views[view] = { version: typeof parsed.version === 'string' ? parsed.version : undefined, objects }
  }

  if (used.size === 0) return { ok: false, error: 'Add some text or an image before saving.' }
  return { ok: true, design: { views, used: [...used.values()], files: [...files] } }
}
