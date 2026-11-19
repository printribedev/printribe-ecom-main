import React from 'react'

export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }

export type LegalDoc = {
  title: string
  updated: string
  intro: string
  sections: { heading: string; blocks: LegalBlock[] }[]
}

const EMAIL = 'info@theprintribe.com'

// Turns the email address inside a sentence into a mailto link.
const withEmail = (text: string) => {
  const parts = text.split(EMAIL)
  if (parts.length === 1) return text
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [part, <a key={i} href={`mailto:${EMAIL}`} className="text-sky underline underline-offset-2">{EMAIL}</a>]
      : [part],
  )
}

export const LegalPage: React.FC<{ doc: LegalDoc }> = ({ doc }) => (
  <div className="container py-12 pb-24">
    <div>
      <p className="text-[15px] text-muted-foreground">Last updated {doc.updated}</p>
      <h1 className="font-heading mt-1 text-[clamp(32px,4.5vw,48px)] leading-tight">{doc.title}</h1>
      <p className="mt-4 text-lg text-body">{doc.intro}</p>

      {doc.sections.map((s) => (
        <section key={s.heading} className="mt-10 border-t border-border pt-8">
          <h2 className="font-heading text-2xl">{s.heading}</h2>
          <div className="mt-4 space-y-3 text-[17px] leading-relaxed text-body">
            {s.blocks.map((b, i) => {
              if (b.type === 'h3') return <h3 key={i} className="font-heading pt-2 text-lg text-ink">{b.text}</h3>
              if (b.type === 'ul')
                return (
                  <ul key={i} className="list-disc space-y-1.5 pl-6">
                    {b.items.map((it) => (
                      <li key={it}>{withEmail(it)}</li>
                    ))}
                  </ul>
                )
              return <p key={i}>{withEmail(b.text)}</p>
            })}
          </div>
        </section>
      ))}
    </div>
  </div>
)
