import type { StudioViewKey } from './types'

/**
 * A simple plain T-shirt picture used until real cut-out photos are uploaded in the admin.
 * It is drawn at 800 x 1000 and filled with the chosen colour. Front and back differ only in the neckline.
 */
export function placeholderShirt(hex: string, view: StudioViewKey): string {
  const light = isLight(hex)
  const outline = light ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.25)'
  const shade = light ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.25)'
  const dip = view === 'back' ? 125 : 185
  const body = `M300,90 L150,160 L40,330 L150,390 L210,330 L210,900 L590,900 L590,330 L650,390 L760,330 L650,160 L500,90 C470,${dip} 330,${dip} 300,90 Z`
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">` +
    `<path d="${body}" fill="${hex}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M210,330 L210,900 L250,900 L250,350 Z" fill="${shade}"/>` +
    `<path d="M590,330 L590,900 L550,900 L550,350 Z" fill="${shade}"/>` +
    `<path d="M300,90 C330,${dip} 470,${dip} 500,90" fill="none" stroke="${outline}" stroke-width="10" stroke-linecap="round"/>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function isLight(hex: string): boolean {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return true
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 299 + g * 587 + b * 114) / 1000 > 140
}
