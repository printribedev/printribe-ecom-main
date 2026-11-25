'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

interface HeaderClientProps {
  data: Header
}

/** Announcement strip + sticky header with the menu, the main button and a mobile menu. */
/** The Design Studio is open, so its menu item never shows a "Soon" tag (even if an old one is saved in the admin). */
const isStudioLink = (l: { url?: string | null } | null | undefined) => typeof l?.url === 'string' && l.url.startsWith('/design')

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const navItems = data?.navItems || []
  const announcement = data?.announcement
  const cta = data?.cta

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const strip = announcement?.enabled && announcement?.text

  const stripContent = (
    <>
      {announcement?.badge && (
        <span className="mr-2 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
          {announcement.badge}
        </span>
      )}
      {announcement?.text}
    </>
  )

  return (
    <>
      {strip &&
        (announcement?.url ? (
          <Link
            href={announcement.url}
            className="block bg-sky px-4 py-2.5 text-center text-sm text-white hover:bg-sky/90"
          >
            {stripContent}
          </Link>
        ) : (
          <div className="bg-sky px-4 py-2.5 text-center text-sm text-white">{stripContent}</div>
        ))}

      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="Printribe home">
            <Logo loading="eager" priority="high" />
          </Link>

          <nav className="hidden items-center gap-7 text-[15px] font-medium lg:flex" aria-label="Main">
            {navItems.map(({ link, soon }, i) => (
              <span key={i} className="flex items-center">
                <CMSLink {...link} className="hover:text-sky" />
                {soon && !isStudioLink(link) && (
                  <span className="ml-1.5 rounded-full bg-sky-tint px-2 py-0.5 text-[10px] font-semibold text-sky">
                    Soon
                  </span>
                )}
              </span>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/account"
              aria-label="My account"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-border bg-white hover:bg-[#F3F4F6] sm:flex"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
              </svg>
            </Link>
            {cta?.url && (
              <Link
                href={cta.url}
                className="whitespace-nowrap rounded-full bg-ink px-5 py-2 text-[15px] font-medium text-white hover:bg-ink/85"
              >
                {cta.label || 'Get a quote'}
              </Link>
            )}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block h-3 w-5">
                <span
                  className={`absolute left-0 h-0.5 w-5 bg-ink transition-all ${open ? 'top-1.5 rotate-45' : 'top-0'}`}
                />
                <span
                  className={`absolute left-0 top-1.5 h-0.5 w-5 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`}
                />
                <span
                  className={`absolute left-0 h-0.5 w-5 bg-ink transition-all ${open ? 'top-1.5 -rotate-45' : 'top-3'}`}
                />
              </span>
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border bg-white lg:hidden" aria-label="Mobile">
            <div className="container flex flex-col py-3">
              {navItems.map(({ link, soon }, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                  <CMSLink {...link} className="text-lg font-medium" />
                  {soon && !isStudioLink(link) && (
                    <span className="rounded-full bg-sky-tint px-2 py-0.5 text-[10px] font-semibold text-sky">
                      Soon
                    </span>
                  )}
                </div>
              ))}
              <div className="border-t border-border py-3 sm:hidden">
                <Link href="/account" className="text-lg font-medium" onClick={() => setOpen(false)}>
                  My account
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  )
}
