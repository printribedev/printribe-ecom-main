import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

/** Public contact details for the floating Need help? button. Only what the owner chose to show. */
export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const s = await payload.findGlobal({ slug: 'contact-settings' })
  return NextResponse.json(
    {
      email: s.email || '',
      whatsapp: (s.whatsapp || '').replace(/[^\d]/g, ''),
      phone: s.phone || '',
      hours: s.hours || '',
      replyTime: s.replyTime || '',
    },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  )
}
