/**
 * The blanks in the Contact page sentence. Shared by the form (browser) and the server checks.
 * Read it like this: "Hi, I'm [name]. I'd like [WHAT] for [WHO], about [QUANTITY] pieces, needed [WHEN]. Reach me on [phone], [BEST_TIME]."
 */
export const ENQUIRY_WHAT = ['T-shirts', 'polos', 'hoodies', 'jerseys', 'caps', 'bags', 'something else'] as const

/** Called "need" in the admin: who the order is for. */
export const ENQUIRY_NEEDS = ['my team or club', 'my college', 'my company', 'an event', 'a gift', 'myself'] as const

export const ENQUIRY_QUANTITIES = ['1 to 10', '11 to 50', '51 to 100', '101 to 500', 'more than 500', 'not sure yet'] as const

/** Saved in the "needed by" field. */
export const ENQUIRY_WHEN = ['as soon as possible', 'within 2 weeks', 'within a month', 'in 2 to 3 months', 'no fixed date'] as const

export const ENQUIRY_BEST_TIME = ['anytime', 'in the morning', 'in the afternoon', 'in the evening'] as const

/** Used by the optional "where did you hear about us" answer. */
export const ENQUIRY_HEARD = ['Instagram', 'Google search', 'Friend or colleague', 'Existing customer', 'An event', 'Other'] as const

export type SentenceParts = { what?: string; need?: string; quantity?: string; neededBy?: string; bestTime?: string }

/** Turns the chosen blanks into a plain sentence, used as the enquiry message and as the WhatsApp text. */
export function sentenceFrom(name: string, p: SentenceParts, details?: string): string {
  const first = name.trim().split(' ')[0] || name.trim()
  const parts = [`Hi, I'm ${name.trim() || first}.`]
  const want = p.what ? `I'd like ${p.what}` : `I'd like to talk about an order`
  parts.push(`${want}${p.need ? ` for ${p.need}` : ''}${p.quantity ? `, about ${p.quantity} pieces` : ''}${p.neededBy ? `, needed ${p.neededBy}` : ''}.`)
  if (p.bestTime) parts.push(`Please contact me ${p.bestTime}.`)
  if (details && details.trim()) parts.push(details.trim())
  return parts.join(' ')
}
