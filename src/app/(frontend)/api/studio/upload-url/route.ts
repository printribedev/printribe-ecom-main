import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import { ALLOWED_TYPES, ENQUIRY_PREFIX, ENQUIRY_TYPES, MAX_UPLOAD_BYTES, presignUpload, publicUrl, r2Configured, UPLOAD_PREFIX } from '@/lib/studio/r2'

/** Gives the browser a short-lived link to upload ONE customer file straight to R2. Type and size are checked here. */
export async function POST(req: Request) {
  if (!r2Configured()) return NextResponse.json({ error: 'Saving designs is not switched on yet.' }, { status: 503 })

  let body: { contentType?: string; size?: number; purpose?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 400 })
  }
  const enquiry = body.purpose === 'enquiry'
  const ext = (enquiry ? ENQUIRY_TYPES : ALLOWED_TYPES)[String(body.contentType)]
  const size = Number(body.size)
  if (!ext) {
    return NextResponse.json({ error: enquiry ? 'Please use a PNG, JPG, WebP, SVG or PDF file.' : 'Please use a PNG, JPG, WebP or SVG image.' }, { status: 400 })
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'This file is too large. The limit is 15 MB.' }, { status: 400 })
  }

  const key = `${enquiry ? ENQUIRY_PREFIX : UPLOAD_PREFIX}${randomUUID()}.${ext}`
  const uploadUrl = await presignUpload(key, String(body.contentType), size)
  return NextResponse.json({ uploadUrl, publicUrl: publicUrl(key) })
}
