import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { Inter } from 'next/font/google'
import React from 'react'

import { HelpButton } from '@/components/Contact/HelpButton'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

// Body text: Inter. Headings use General Sans, loaded below from Fontshare (see --font-display in globals.css).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The site is light-only: the theme is fixed instead of following the visitor's system setting.
    <html className={cn(inter.variable)} data-theme="light" lang="en" suppressHydrationWarning>
      <head>
        <link href="https://api.fontshare.com" rel="preconnect" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@500,600&display=swap"
          rel="stylesheet"
        />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <HelpButton />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: 'Printribe',
  description: 'Custom apparel and accessories, made right and delivered on time.',
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
