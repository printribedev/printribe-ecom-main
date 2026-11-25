import React from 'react'

/** The narrow centred card used by the sign in, create account and password pages. */
export const AuthShell: React.FC<{ title: string; intro?: string; children: React.ReactNode; footer?: React.ReactNode }> = ({ title, intro, children, footer }) => (
  <div className="container py-14 pb-24">
    <div className="mx-auto max-w-md">
      <h1 className="font-heading text-[clamp(30px,4vw,42px)] leading-tight">{title}</h1>
      {intro && <p className="mt-3 text-lg text-body">{intro}</p>}
      <div className="mt-8">{children}</div>
      {footer && <div className="mt-8 border-t border-border pt-6 text-center text-[15px] text-body">{footer}</div>}
    </div>
  </div>
)
