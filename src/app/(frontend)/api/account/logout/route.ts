import { NextResponse } from 'next/server'

import { sameOrigin, SESSION_COOKIE, sessionCookieOptions } from '@/lib/account/session'

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Something went wrong.' }, { status: 403 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 })
  return res
}
