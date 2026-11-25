/** The quote basket lives in the visitor's own browser (localStorage). It only remembers WHAT was picked; prices come from the server. */
export type BasketItem = { kind: 'product'; slug: string; colour?: string; qty: number } | { kind: 'design'; token: string }

const KEY = 'pt_quote_v1'

export function getBasket(): BasketItem[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    const v = raw ? JSON.parse(raw) : []
    return Array.isArray(v) ? (v as BasketItem[]).slice(0, 20) : []
  } catch {
    return []
  }
}

export function setBasket(items: BasketItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 20)))
  } catch {}
}

/** Adds an item; the same product in the same colour (or the same design) replaces the earlier one instead of doubling up. */
export function addToBasket(item: BasketItem) {
  const items = getBasket().filter((x) => {
    if (item.kind === 'design') return !(x.kind === 'design' && x.token === item.token)
    return !(x.kind === 'product' && x.slug === item.slug && (x.colour || '') === (item.colour || ''))
  })
  items.push(item)
  setBasket(items)
}

export function clearBasket() {
  try {
    window.localStorage.removeItem(KEY)
  } catch {}
}
