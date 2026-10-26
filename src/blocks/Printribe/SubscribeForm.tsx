'use client'

import React, { useState } from 'react'

type Props = {
  source: 'newsletter' | 'design-studio'
  buttonLabel?: string | null
  /** "dark" = for black or sky backgrounds, "light" = for white backgrounds */
  tone?: 'dark' | 'light'
  placeholder?: string
}

/** Email sign-up that posts to /api/subscribe. Shows a friendly message once it works. */
export const SubscribeForm: React.FC<Props> = ({
  source,
  buttonLabel,
  tone = 'dark',
  placeholder = 'Your email',
}) => {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot: real people never fill this in
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, website }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  const dark = tone === 'dark'

  if (state === 'done') {
    return (
      <p className={`rounded-full px-5 py-3 text-[15px] ${dark ? 'bg-white/10 text-white' : 'bg-sky-tint text-sky'}`}>
        Thank you! You&apos;re on the list.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md" noValidate>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          aria-label="Email address"
          className={`min-w-0 flex-[1_1_180px] rounded-full border px-5 py-3 text-base outline-none ${
            dark
              ? 'border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:border-white'
              : 'border-border bg-white text-ink placeholder:text-muted-foreground focus:border-sky'
          }`}
        />
        {/* Honeypot, hidden from people and screen readers */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
        />
        <button
          disabled={state === 'sending'}
          className={`rounded-full px-6 py-3 text-[17px] font-medium transition-colors disabled:opacity-60 ${
            dark ? 'bg-sky-bright text-[#00253a] hover:bg-sky-bright/90' : 'bg-sky text-white hover:bg-sky/90'
          }`}
        >
          {state === 'sending' ? 'Sending…' : buttonLabel || 'Join'}
        </button>
      </div>
      {state === 'error' && (
        <p role="alert" className={`mt-2 text-sm ${dark ? 'text-white/80' : 'text-destructive'}`}>
          That didn&apos;t work. Please check your email address and try again.
        </p>
      )}
    </form>
  )
}
