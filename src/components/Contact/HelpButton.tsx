'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

type Info = { email: string; whatsapp: string; phone: string; hours: string; replyTime: string }

// Pages that already have their own full-screen tools or all the contact options
const HIDDEN_ON = ['/design', '/admin', '/print', '/contact']

/** A small "Need help?" button on every page: WhatsApp, call, or write to us. */
export const HelpButton: React.FC = () => {
  const path = usePathname() || ''
  const [open, setOpen] = useState(false)
  const [info, setInfo] = useState<Info | null>(null)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || info) return
    fetch('/api/contact-info')
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ email: '', whatsapp: '', phone: '', hours: '', replyTime: '' }))
  }, [open, info])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [open])

  useEffect(() => setOpen(false), [path])

  if (HIDDEN_ON.some((p) => path === p || path.startsWith(p + '/'))) return null

  const waText = typeof window !== 'undefined' ? `Hi Printribe, I need help with this page: ${window.location.href}` : 'Hi Printribe, I need help'

  return (
    <div ref={box} className="fixed bottom-4 right-4 z-40 print:hidden">
      {open && (
        <div role="dialog" aria-label="Need help?" className="mb-3 w-[290px] rounded-2xl border border-border bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,.18)]">
          <h2 className="font-heading text-lg">Need help?</h2>
          <p className="mt-1 text-[15px] text-body">Talk to a real person at Printribe.</p>
          <ul className="mt-4 space-y-2 text-[16px]">
            {info?.whatsapp && (
              <li>
                <a href={`https://wa.me/${info.whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="block rounded-xl bg-ink px-4 py-3 text-center font-medium text-white hover:bg-ink/85">
                  Chat on WhatsApp
                </a>
              </li>
            )}
            {info?.phone && (
              <li>
                <a href={`tel:${info.phone.replace(/[^\d+]/g, '')}`} className="block rounded-xl border border-border px-4 py-3 text-center font-medium hover:bg-[#F3F4F6]">
                  Call {info.phone}
                </a>
              </li>
            )}
            <li>
              <Link href="/contact" className="block rounded-xl border border-border px-4 py-3 text-center font-medium hover:bg-[#F3F4F6]">
                Write to us
              </Link>
            </li>
          </ul>
          {info?.hours && <p className="mt-3 text-sm text-muted-foreground">{info.hours}</p>}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="ml-auto flex items-center gap-2 rounded-full bg-sky px-5 py-3 text-[16px] font-medium text-white shadow-[0_6px_24px_rgba(3,105,161,.4)] hover:bg-sky/90"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
        </svg>
        Need help?
      </button>
    </div>
  )
}
