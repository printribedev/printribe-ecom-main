/** Price maths in whole rupees. The server always recomputes from the product; it never trusts the browser. */
export type Tier = { minQuantity: number; price: number }

export function unitPriceFor(base: number, tiers: Tier[] | null | undefined, qty: number): number {
  let price = base
  const sorted = [...(tiers || [])].sort((a, b) => a.minQuantity - b.minQuantity)
  for (const t of sorted) if (qty >= t.minQuantity) price = t.price
  return price
}

export function deliveryFeeFor(subtotal: number, rule: { fee: number; freeAbove: number }): number {
  return subtotal >= rule.freeAbove ? 0 : rule.fee
}
