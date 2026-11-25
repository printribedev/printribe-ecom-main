'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

type Snapshot = {
  printingPerPiece?: number | null
  previews?: { view?: string | null; url?: string | null }[] | null
  areasUsed?: { view?: string | null; areaName?: string | null; size?: string | null; methodTitle?: string | null; extra?: number | null }[] | null
  files?: { url?: string | null }[] | null
}
type OrderData = { orderNumber?: string; designSnapshot?: Snapshot | null }

const cap = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const money = (n?: number | null) => '₹' + Math.round(n || 0).toLocaleString('en-IN')

const box: React.CSSProperties = { border: '1px solid var(--theme-elevation-150)', borderRadius: 8, padding: 16, marginBottom: 16 }
const th: React.CSSProperties = { textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid var(--theme-elevation-150)', fontWeight: 600 }
const td: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid var(--theme-elevation-100)' }

/**
 * Shown on an order that came from the design studio: big previews, the print areas and methods,
 * the customer's original files, and a button that opens the printable job sheet.
 */
export const OrderDesignPanel: React.FC = () => {
  const { id } = useDocumentInfo()
  const [o, setO] = useState<OrderData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/orders/${id}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setO)
      .catch(() => setFailed(true))
  }, [id])

  if (failed) return <p style={{ color: 'var(--theme-error-500)' }}>Could not load the customer&apos;s design. Please refresh the page.</p>
  if (!o) return <p>Loading the customer&apos;s design…</p>

  const snap = o.designSnapshot
  const previews = (snap?.previews || []).filter((p) => p.url)
  const files = (snap?.files || []).filter((f) => f.url)
  const areas = snap?.areasUsed || []

  return (
    <div style={{ margin: '8px 0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Customer&apos;s design</h3>
        {o.orderNumber && (
          <a
            href={`/print/${encodeURIComponent(o.orderNumber)}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn--style-primary btn--size-medium"
            style={{ textDecoration: 'none' }}
          >
            Open printable job sheet
          </a>
        )}
      </div>

      {previews.length > 0 && (
        <div style={{ ...box, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {previews.map((p) => (
            <a key={p.url} href={p.url!} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url!} alt={`${cap(p.view)} view of the design`} style={{ width: '100%', borderRadius: 6, background: '#f3f4f6' }} />
              <div style={{ marginTop: 6, fontWeight: 600 }}>{cap(p.view) || 'Side'}</div>
            </a>
          ))}
        </div>
      )}

      {areas.length > 0 && (
        <div style={box}>
          <h4 style={{ marginTop: 0 }}>What to print and how</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Side</th>
                <th style={th}>Print area</th>
                <th style={th}>Area size</th>
                <th style={th}>Print method</th>
                <th style={th}>Extra per piece</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a, i) => (
                <tr key={i}>
                  <td style={td}>{cap(a.view)}</td>
                  <td style={td}>{a.areaName}</td>
                  <td style={td}>{cap(a.size)}</td>
                  <td style={td}>{a.methodTitle || '—'}</td>
                  <td style={td}>{money(a.extra)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {files.length > 0 && (
        <div style={box}>
          <h4 style={{ marginTop: 0 }}>Customer&apos;s original files</h4>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {files.map((f, i) => (
              <li key={f.url} style={{ marginBottom: 4 }}>
                <a href={f.url!} target="_blank" rel="noreferrer">
                  File {i + 1} ({(f.url || '').split('.').pop()?.toUpperCase()})
                </a>{' '}
                <span style={{ color: 'var(--theme-elevation-500)' }}>opens in a new tab: right-click and choose &quot;Save as&quot; to download</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
