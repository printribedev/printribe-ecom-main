import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import type { Footer as FooterType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  const data: FooterType = await getCachedGlobal('footer', 1)()

  const columns = data?.columns || []
  const socials = data?.socials || []
  const legalLinks = data?.navItems || []
  const contact = data?.contact

  return (
    <footer className="mt-auto bg-ink text-[15px] text-[#c7c7cc]">
      <div className="container py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" aria-label="Printribe home">
              {/* The logo is white-on-dark here */}
              <Logo className="brightness-0 invert" />
            </Link>
            {data?.about && <p className="mt-4 max-w-xs">{data.about}</p>}
            {(contact?.email || contact?.phone) && (
              <div className="mt-4 space-y-1">
                {contact?.email && (
                  <p>
                    <a className="hover:text-white" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                  </p>
                )}
                {contact?.phone && <p>{contact.phone}</p>}
              </div>
            )}
            {socials.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {socials.map((s, i) => (
                  <a key={i} className="hover:text-white" href={s.url} rel="noreferrer" target="_blank">
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="mb-3 font-medium text-white">{col.title}</h4>
              <ul className="space-y-2">
                {(col.links || []).map(({ link }, j) => (
                  <li key={j}>
                    <CMSLink {...link} className="hover:text-white" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[#38383a] pt-6 text-sm text-[#9a9aa0] md:flex-row md:items-center md:justify-between">
          <p>{data?.legalText || '© Printribe. All rights reserved.'}</p>
          {legalLinks.length > 0 && (
            <nav className="flex gap-5">
              {legalLinks.map(({ link }, i) => (
                <CMSLink key={i} {...link} className="hover:text-white" />
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  )
}
