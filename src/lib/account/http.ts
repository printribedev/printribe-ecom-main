import { NextResponse } from 'next/server'

import { makeSessionValue, SESSION_COOKIE, sessionCookieOptions } from './session'

export const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) => NextResponse.json({ error, ...extra }, { status })

/** A success response that also signs the customer in (sets the session cookie). */
export function okWithSession(customer: { id: number; sessionVersion?: number | null }, body: Record<string, unknown> = {}) {
  const res = NextResponse.json({ ok: true, ...body })
  res.cookies.set(SESSION_COOKIE, makeSessionValue(customer), sessionCookieOptions)
  return res
}

export const readJson = async <T,>(req: Request): Promise<T | null> => {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

export const cleanEmail = (v: unknown) => String(v ?? '').trim().toLowerCase()
