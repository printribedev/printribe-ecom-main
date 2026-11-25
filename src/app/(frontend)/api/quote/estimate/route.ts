import { NextResponse } from 'next/server'

import { fail, readJson } from '@/lib/account/http'
import { sameOrigin } from '@/lib/account/session'
import { estimateItems, MAX_QUOTE_ITEMS, type QuoteItemInput } from '@/lib/quote/estimate'

/** Prices the items in a quote basket. Shop prices are public, so no sign-in is needed; the price comes only from the database. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail('Something went wrong. Please try again.', 403)
  const body = await readJson<{ items?: QuoteItemInput[] }>(req)
  const items = Array.isArray(body?.items) ? body!.items.slice(0, MAX_QUOTE_ITEMS) : []
  const lines = await estimateItems(items)
  const subtotal = lines.reduce((s, l) => s + (l.ok ? l.lineTotal : 0), 0)
  return NextResponse.json({ lines, subtotal })
}
