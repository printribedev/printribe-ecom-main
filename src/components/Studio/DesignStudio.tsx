'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Canvas, FabricObject, Textbox } from 'fabric'

import { unitPriceFor } from '@/lib/shop/pricing'
import { isLight, placeholderShirt } from '@/lib/studio/placeholder'
import { studioExtras } from '@/lib/studio/pricing'
import { VIEW_LABELS, type StudioArea, type StudioProduct, type StudioViewKey } from '@/lib/studio/types'

type Fabric = typeof import('fabric')
type Tagged = FabricObject & { areaKey?: string }
type Sel = { type: 'text' | 'image'; fill: string; fontFamily: string; fontSize: number } | null

/** The design is drawn on a canvas that is always this many units wide. The screen just scales it. */
const LW = 1000
const FONTS = ['Inter', 'Arial', 'Arial Black', 'Georgia', 'Times New Roman', 'Courier New', 'Impact', 'Trebuchet MS', 'Verdana']
const MAX_IMAGE_PX = 1600
const MAX_FILE_MB = 15

const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const btn =
  'inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-sm text-ink hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40'

/** Shrinks a big photo so the editor stays fast. Returns a short blob link instead of a huge data string. */
async function prepareImage(file: File): Promise<string> {
  if (file.type === 'image/svg+xml') return URL.createObjectURL(file)
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, MAX_IMAGE_PX / Math.max(bmp.width, bmp.height))
  const cv = document.createElement('canvas')
  cv.width = Math.round(bmp.width * k)
  cv.height = Math.round(bmp.height * k)
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height)
  const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'
  const blob = await new Promise<Blob | null>((res) => cv.toBlob(res, type, 0.92))
  if (!blob) throw new Error('Could not read this image.')
  return URL.createObjectURL(blob)
}

export const DesignStudio: React.FC<{ p: StudioProduct }> = ({ p }) => {
  const [colourIdx, setColourIdx] = useState(0)
  const [view, setView] = useState<StudioViewKey>(p.views[0].view)
  const [activeArea, setActiveArea] = useState<string>(p.views[0].areas[0]?.key || '')
  const [methodByArea, setMethodByArea] = useState<Record<string, number>>({})
  const [usedKeys, setUsedKeys] = useState<string[]>([])
  const [sel, setSel] = useState<Sel>(null)
  const [qty, setQty] = useState(Math.max(1, p.minQty))
  const [ar, setAr] = useState(0.8)
  const [ready, setReady] = useState(false)
  const [hist, setHistState] = useState({ undo: false, redo: false })
  const [notice, setNotice] = useState('')

  const canvasEl = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<Canvas | null>(null)
  const fabricRef = useRef<Fabric | null>(null)
  const designsRef = useRef<Record<string, string>>({})
  const histRef = useRef<{ stack: string[]; idx: number }>({ stack: [], idx: 0 })
  const loadingRef = useRef(false)

  const colour = p.colours[colourIdx] || { name: '', hex: '#FFFFFF', mockups: {} }
  const viewDef = p.views.find((v) => v.view === view) || p.views[0]
  const areas = viewDef.areas
  const allAreas = useMemo(() => p.views.flatMap((v) => v.areas), [p.views])
  const mockupSrc = colour.mockups[view] || placeholderShirt(colour.hex, view)

  // Latest values for the canvas event handlers, which are created once.
  const viewRef = useRef(view)
  const areasRef = useRef(areas)
  const activeAreaRef = useRef(activeArea)
  const colourHexRef = useRef('#FFFFFF')
  viewRef.current = view
  areasRef.current = areas
  activeAreaRef.current = activeArea
  colourHexRef.current = colour.hex

  /* ---------- helpers that work on the canvas ---------- */

  const areaRect = (a: StudioArea) => {
    const c = canvasRef.current!
    const W = c.getWidth()
    const H = c.getHeight()
    return { ax: (a.x / 100) * W, ay: (a.y / 100) * H, aw: (a.width / 100) * W, ah: (a.height / 100) * H }
  }

  /** Keeps an element inside the print area it belongs to. */
  const constrain = useCallback((o?: FabricObject) => {
    const c = canvasRef.current
    if (!o || !c) return
    const a = areasRef.current.find((x) => x.key === (o as Tagged).areaKey)
    if (!a) return
    const { ax, ay, aw, ah } = areaRect(a)
    o.setCoords()
    let br = o.getBoundingRect()
    if (br.width > aw + 0.5 || br.height > ah + 0.5) {
      const f = Math.min(aw / br.width, ah / br.height)
      o.scaleX = (o.scaleX || 1) * f
      o.scaleY = (o.scaleY || 1) * f
      o.setCoords()
      br = o.getBoundingRect()
    }
    if (br.left < ax) o.left += ax - br.left
    if (br.top < ay) o.top += ay - br.top
    if (br.left + br.width > ax + aw) o.left -= br.left + br.width - (ax + aw)
    if (br.top + br.height > ay + ah) o.top -= br.top + br.height - (ay + ah)
    o.setCoords()
  }, [])

  const refreshUsed = useCallback(() => {
    const keys = new Set<string>()
    for (const json of Object.values(designsRef.current)) {
      try {
        for (const o of JSON.parse(json).objects || []) if (o.areaKey) keys.add(o.areaKey)
      } catch {}
    }
    setUsedKeys([...keys])
  }, [])

  const setHist = useCallback(() => {
    const h = histRef.current
    setHistState({ undo: h.idx > 0, redo: h.idx < h.stack.length - 1 })
  }, [])

  /** Records the current drawing as one undo step and remembers it for this side of the product. */
  const commit = useCallback(() => {
    const c = canvasRef.current
    if (!c || loadingRef.current) return
    const json = JSON.stringify(c.toObject(['areaKey']))
    const h = histRef.current
    if (h.stack[h.idx] === json) return
    h.stack = h.stack.slice(0, h.idx + 1)
    h.stack.push(json)
    if (h.stack.length > 30) h.stack.shift()
    h.idx = h.stack.length - 1
    designsRef.current[viewRef.current] = json
    setHist()
    refreshUsed()
  }, [refreshUsed, setHist])

  const loadJson = useCallback(async (json?: string) => {
    const c = canvasRef.current
    if (!c) return
    loadingRef.current = true
    try {
      if (json) await c.loadFromJSON(json)
      else c.clear()
      c.discardActiveObject()
      c.requestRenderAll()
    } finally {
      loadingRef.current = false
    }
  }, [])

  const syncSel = useCallback(() => {
    const f = fabricRef.current
    const o = canvasRef.current?.getActiveObject()
    if (!f || !o) return setSel(null)
    const key = (o as Tagged).areaKey
    if (key) setActiveArea(key)
    if (o instanceof f.Textbox) {
      setSel({ type: 'text', fill: String(o.fill || '#111111'), fontFamily: o.fontFamily, fontSize: Math.round(o.fontSize) })
    } else {
      setSel({ type: 'image', fill: '', fontFamily: '', fontSize: 0 })
    }
  }, [])

  /* ---------- start the canvas once ---------- */

  useEffect(() => {
    let disposed = false
    let c: Canvas | null = null
    ;(async () => {
      const fabric = await import('fabric')
      if (disposed || !canvasEl.current) return
      fabricRef.current = fabric
      const cv = new fabric.Canvas(canvasEl.current, { width: LW, height: Math.round(LW / 0.8), preserveObjectStacking: true, selection: false })
      c = cv
      canvasRef.current = cv
      cv.on('object:moving', (e) => constrain(e.target))
      cv.on('object:scaling', (e) => constrain(e.target))
      cv.on('object:rotating', (e) => constrain(e.target))
      cv.on('object:modified', (e) => {
        constrain(e.target)
        cv.requestRenderAll()
        commit()
        syncSel()
      })
      cv.on('text:editing:exited', () => {
        constrain(cv.getActiveObject())
        commit()
        syncSel()
      })
      cv.on('selection:created', syncSel)
      cv.on('selection:updated', syncSel)
      cv.on('selection:cleared', () => setSel(null))
      commit()
      setReady(true)
    })()
    return () => {
      disposed = true
      c?.dispose()
      canvasRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- keep the canvas the same shape as the product photo ---------- */

  useEffect(() => {
    const im = new Image()
    im.onload = () => {
      if (im.naturalWidth && im.naturalHeight) setAr(im.naturalWidth / im.naturalHeight)
    }
    im.src = mockupSrc
  }, [mockupSrc])

  useEffect(() => {
    const c = canvasRef.current
    if (!ready || !c) return
    c.setDimensions({ width: LW, height: Math.round(LW / ar) })
    c.setDimensions({ width: '100%', height: '100%' }, { cssOnly: true })
    Object.assign(c.wrapperEl.style, { position: 'absolute', inset: '0', width: '100%', height: '100%' })
    c.getObjects().forEach((o) => constrain(o))
    c.requestRenderAll()
  }, [ar, ready, constrain])

  /* ---------- switching sides ---------- */

  const switchView = (v: StudioViewKey) => {
    if (v === view) return
    setView(v)
    setActiveArea(p.views.find((x) => x.view === v)?.areas[0]?.key || '')
  }

  useEffect(() => {
    const c = canvasRef.current
    if (!ready || !c) return
    ;(async () => {
      await loadJson(designsRef.current[view])
      histRef.current = { stack: [JSON.stringify(c.toObject(['areaKey']))], idx: 0 }
      setHist()
      setSel(null)
    })()
    // Only when the side changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, ready])

  /* ---------- tools ---------- */

  const currentArea = () => areasRef.current.find((a) => a.key === activeAreaRef.current) || areasRef.current[0]

  const addText = () => {
    const f = fabricRef.current
    const c = canvasRef.current
    const a = currentArea()
    if (!f || !c || !a) return
    const { ax, ay, aw, ah } = areaRect(a)
    const t = new f.Textbox('Your text', {
      left: ax + aw / 2,
      top: ay + ah / 2,
      originX: 'center',
      originY: 'center',
      width: aw * 0.7,
      fontSize: Math.max(20, Math.round(aw * 0.14)),
      fontFamily: 'Inter',
      fill: isLight(colourHexRef.current) ? '#111111' : '#FFFFFF',
      textAlign: 'center',
    })
    ;(t as Tagged).areaKey = a.key
    c.add(t)
    c.setActiveObject(t)
    constrain(t)
    c.requestRenderAll()
    commit()
    syncSel()
  }

  const addImage = async (file: File) => {
    const f = fabricRef.current
    const c = canvasRef.current
    const a = currentArea()
    if (!f || !c || !a) return
    setNotice('')
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return setNotice('Please use a PNG, JPG, WebP or SVG image.')
    if (file.size > MAX_FILE_MB * 1024 * 1024) return setNotice(`This file is over ${MAX_FILE_MB} MB. Please choose a smaller one.`)
    try {
      const url = await prepareImage(file)
      const img = await f.FabricImage.fromURL(url)
      const { ax, ay, aw, ah } = areaRect(a)
      const k = Math.min((aw * 0.8) / img.width, (ah * 0.8) / img.height)
      img.set({ left: ax + aw / 2, top: ay + ah / 2, originX: 'center', originY: 'center', scaleX: k, scaleY: k })
      ;(img as Tagged).areaKey = a.key
      c.add(img)
      c.setActiveObject(img)
      constrain(img)
      c.requestRenderAll()
      commit()
      syncSel()
    } catch {
      setNotice('We could not open this image. Please try another file.')
    }
  }

  const removeSelected = () => {
    const c = canvasRef.current
    if (!c) return
    c.getActiveObjects().forEach((o) => c.remove(o))
    c.discardActiveObject()
    c.requestRenderAll()
    setSel(null)
    commit()
  }

  const duplicate = async () => {
    const c = canvasRef.current
    const o = c?.getActiveObject()
    if (!c || !o) return
    const copy = (await o.clone(['areaKey'])) as Tagged
    copy.set({ left: (o.left || 0) + 24, top: (o.top || 0) + 24 })
    c.add(copy)
    c.setActiveObject(copy)
    constrain(copy)
    c.requestRenderAll()
    commit()
    syncSel()
  }

  const centre = () => {
    const c = canvasRef.current
    const o = c?.getActiveObject() as Tagged | undefined
    if (!c || !o) return
    const a = areasRef.current.find((x) => x.key === o.areaKey)
    if (!a) return
    const { ax, ay, aw, ah } = areaRect(a)
    const br = o.getBoundingRect()
    o.left += ax + aw / 2 - (br.left + br.width / 2)
    o.top += ay + ah / 2 - (br.top + br.height / 2)
    o.setCoords()
    c.requestRenderAll()
    commit()
  }

  const step = async (d: -1 | 1) => {
    const h = histRef.current
    const ni = h.idx + d
    if (ni < 0 || ni >= h.stack.length) return
    h.idx = ni
    const json = h.stack[ni]
    await loadJson(json)
    designsRef.current[viewRef.current] = json
    setHist()
    refreshUsed()
    setSel(null)
  }

  const setTextProp = (k: 'fill' | 'fontFamily' | 'fontSize', v: string | number) => {
    const f = fabricRef.current
    const c = canvasRef.current
    const o = c?.getActiveObject()
    if (!f || !c || !o || !(o instanceof f.Textbox)) return
    o.set(k, v as never)
    ;(o as Textbox).initDimensions()
    constrain(o)
    o.setCoords()
    c.requestRenderAll()
    commit()
    syncSel()
  }

  // Delete key removes the selected element (unless the person is typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const t = e.target as HTMLElement
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      const o = canvasRef.current?.getActiveObject() as (FabricObject & { isEditing?: boolean }) | undefined
      if (!o || o.isEditing) return
      e.preventDefault()
      removeSelected()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- price ---------- */

  const prices = useMemo(
    () => Object.fromEntries(p.methods.map((m) => [m.id, { small: m.small, medium: m.medium, large: m.large }])),
    [p.methods],
  )
  const methodFor = (key: string) => methodByArea[key] ?? p.methods[0]?.id ?? null
  const usedAreas = allAreas.filter((a) => usedKeys.includes(a.key))
  const extras = studioExtras(usedAreas.map((a) => ({ size: a.size, methodId: methodFor(a.key) })), prices)
  const base = unitPriceFor(p.price, p.tiers, qty)
  const perPiece = base + extras
  const total = perPiece * qty

  /* ---------- screen ---------- */

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F3F4F6] text-ink">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3">
        <Link href={`/products/${p.slug}`} className="text-[15px] text-body hover:text-ink">
          ← Back to product
        </Link>
        <div className="font-heading truncate text-[17px]">{p.title}</div>
        <div className="hidden text-sm text-muted-foreground sm:block">Design studio</div>
      </header>

      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_380px] lg:overflow-hidden">
        {/* Canvas side */}
        <main className="flex flex-col items-center gap-3 px-4 py-4 lg:min-h-0 lg:overflow-y-auto">
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            <button type="button" className={btn} onClick={addText} disabled={!ready || !areas.length}>
              + Add text
            </button>
            <label className={`${btn} cursor-pointer`}>
              + Add image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                disabled={!ready || !areas.length}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void addImage(f)
                  e.target.value = ''
                }}
              />
            </label>
            <button type="button" className={btn} onClick={() => step(-1)} disabled={!hist.undo}>
              Undo
            </button>
            <button type="button" className={btn} onClick={() => step(1)} disabled={!hist.redo}>
              Redo
            </button>
            <button type="button" className={btn} onClick={duplicate} disabled={!sel}>
              Duplicate
            </button>
            <button type="button" className={btn} onClick={centre} disabled={!sel}>
              Centre
            </button>
            <button type="button" className={btn} onClick={removeSelected} disabled={!sel}>
              Delete
            </button>
          </div>

          {sel?.type === 'text' && (
            <div className="flex w-full max-w-[760px] flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-2.5 text-sm">
              <label className="flex items-center gap-2">
                Font
                <select value={sel.fontFamily} onChange={(e) => setTextProp('fontFamily', e.target.value)} className="rounded-lg border border-border px-2 py-1.5">
                  {FONTS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                Size
                <input
                  type="number"
                  min={8}
                  max={400}
                  value={sel.fontSize}
                  onChange={(e) => setTextProp('fontSize', Math.max(8, Number(e.target.value) || 8))}
                  className="w-20 rounded-lg border border-border px-2 py-1.5"
                />
              </label>
              <label className="flex items-center gap-2">
                Colour
                <input type="color" value={sel.fill} onChange={(e) => setTextProp('fill', e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border" />
              </label>
              <span className="text-muted-foreground">Double-click the text on the product to edit it.</span>
            </div>
          )}
          {notice && (
            <p role="alert" className="rounded-lg bg-error/10 px-4 py-2 text-sm text-error">
              {notice}
            </p>
          )}

          {/* Sides */}
          <div className="flex gap-1.5" role="tablist" aria-label="Product side">
            {p.views.map((v) => (
              <button
                key={v.view}
                type="button"
                role="tab"
                aria-selected={v.view === view}
                onClick={() => switchView(v.view)}
                className={`rounded-full px-4 py-1.5 text-sm ${v.view === view ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-white/70'}`}
              >
                {VIEW_LABELS[v.view]}
              </button>
            ))}
          </div>

          {/* The product with the design on it */}
          <div className="relative max-w-full" style={{ aspectRatio: String(ar), width: `min(100%, ${70 * ar}vh)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mockupSrc} alt={`${p.title}, ${colour.name}, ${VIEW_LABELS[view]}`} className="absolute inset-0 h-full w-full select-none object-contain" draggable={false} />
            {areas.map((a) => (
              <div
                key={a.key}
                aria-hidden
                className={`pointer-events-none absolute rounded-sm border-2 border-dashed ${a.key === activeArea ? 'border-sky bg-sky/5' : 'border-[#9CA3AF]'}`}
                style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.width}%`, height: `${a.height}%` }}
              >
                <span className={`absolute -top-5 left-0 whitespace-nowrap text-[11px] ${a.key === activeArea ? 'text-sky' : 'text-[#6B7280]'}`}>{a.name}</span>
              </div>
            ))}
            {/* Fabric moves the canvas into its own container, so React gets a wrapper it never changes inside */}
            <div className="absolute inset-0">
              <canvas ref={canvasEl} />
            </div>
          </div>
          {!areas.length && <p className="text-sm text-muted-foreground">No print areas are set up for this side yet.</p>}
        </main>

        {/* Side panel */}
        <aside className="space-y-6 border-t border-border bg-white p-5 lg:overflow-y-auto lg:border-l lg:border-t-0">
          <section>
            <h2 className="font-heading text-lg">Colour: {colour.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.colours.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColourIdx(i)}
                  aria-label={c.name}
                  title={c.name}
                  className={`h-9 w-9 rounded-full border ${i === colourIdx ? 'ring-2 ring-sky ring-offset-2' : 'border-border'}`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-heading text-lg">Where it goes</h2>
            <p className="mt-1 text-sm text-body">New text and images are placed in the highlighted area.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {areas.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setActiveArea(a.key)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm ${a.key === activeArea ? 'border-sky bg-sky/10 text-sky' : 'border-border hover:bg-[#F3F4F6]'}`}
                >
                  {a.name}
                </button>
              ))}
            </div>
            {areas.find((a) => a.key === activeArea)?.sizeNote && (
              <p className="mt-2 text-sm text-muted-foreground">{areas.find((a) => a.key === activeArea)?.sizeNote}</p>
            )}
          </section>

          <section>
            <h2 className="font-heading text-lg">Print method</h2>
            {p.methods.length === 0 ? (
              <p className="mt-2 text-sm text-body">Print methods have not been set up yet, so extras are not added.</p>
            ) : usedAreas.length === 0 ? (
              <p className="mt-2 text-sm text-body">Add text or an image and choose how each area is printed.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {usedAreas.map((a) => {
                  const m = p.methods.find((x) => x.id === methodFor(a.key))
                  return (
                    <li key={a.key} className="rounded-xl border border-border p-3 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-heading text-[15px]">{a.name}</span>
                        <span className="text-muted-foreground">{rupees(m ? m[a.size] : 0)} per piece</span>
                      </div>
                      <select
                        value={methodFor(a.key) ?? ''}
                        onChange={(e) => setMethodByArea((cur) => ({ ...cur, [a.key]: Number(e.target.value) }))}
                        className="mt-2 w-full rounded-lg border border-border px-2.5 py-2"
                        aria-label={`Print method for ${a.name}`}
                      >
                        {p.methods.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.title}
                          </option>
                        ))}
                      </select>
                      {m?.description && <p className="mt-1.5 text-muted-foreground">{m.description}</p>}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl bg-[#F3F4F6] p-4">
            <h2 className="font-heading text-lg">Price</h2>
            <label className="mt-3 flex items-center justify-between gap-3 text-sm">
              Quantity
              <input
                type="number"
                min={p.minQty}
                value={qty}
                onChange={(e) => setQty(Math.max(p.minQty, Math.floor(Number(e.target.value)) || p.minQty))}
                className="w-24 rounded-lg border border-border bg-white px-2.5 py-2"
              />
            </label>
            {p.minQty > 1 && <p className="mt-1 text-right text-xs text-muted-foreground">Minimum {p.minQty} pieces</p>}
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-body">
                <dt>Product</dt>
                <dd>{rupees(base)}</dd>
              </div>
              <div className="flex justify-between text-body">
                <dt>Printing ({usedAreas.length} {usedAreas.length === 1 ? 'area' : 'areas'})</dt>
                <dd>{rupees(extras)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-body">
                <dt>Per piece</dt>
                <dd>{rupees(perPiece)}</dd>
              </div>
              <div className="font-heading flex justify-between text-lg text-ink">
                <dt>Total ({qty} pieces)</dt>
                <dd>{rupees(total)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">GST included. Delivery is added at checkout.</p>
            <button type="button" disabled className="mt-4 w-full cursor-not-allowed rounded-full bg-sky/50 py-3 text-[16px] font-medium text-white">
              Continue to checkout
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Saving your design and checkout come in the next step.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
