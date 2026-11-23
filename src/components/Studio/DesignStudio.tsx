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
/** Where the selected element sits on the canvas (canvas units) and how big it prints, in inches. */
type Box = { l: number; t: number; w: number; h: number; wIn: number | null; hIn: number | null; areaKey: string }

/** The design is drawn on a canvas that is always this many units wide. The screen just scales it. */
const LW = 1000
const FONTS = ['Inter', 'Arial', 'Arial Black', 'Georgia', 'Times New Roman', 'Courier New', 'Impact', 'Trebuchet MS', 'Verdana']
const MAX_IMAGE_PX = 1600
const MAX_FILE_MB = 15

const rupees = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
const fmtIn = (n: number) => String(Math.round(n * 10) / 10)

/** True when a design of this size (inches) is bigger than the print method can do. */
const tooBig = (w: number, h: number, m?: { maxWidthIn: number | null; maxHeightIn: number | null } | null) =>
  !!m && !!((m.maxWidthIn && w > m.maxWidthIn + 0.05) || (m.maxHeightIn && h > m.maxHeightIn + 0.05))

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

export type SavedDesign = {
  token: string
  colour: string
  qty: number
  views: Record<string, string>
  methodByArea: Record<string, number>
}

/** Words used to spot SVG files that carry code. We refuse those. */
const UNSAFE_SVG = /<script|javascript:|\son\w+\s*=|<foreignObject/i

/** Saved images come from R2, so ask for them with permission to be drawn into a preview picture. */
const withCors = (json: string) => {
  try {
    const o = JSON.parse(json)
    for (const x of o.objects || []) if (String(x.type).toLowerCase() === 'image') x.crossOrigin = 'anonymous'
    return JSON.stringify(o)
  } catch {
    return json
  }
}

const loadImg = (src: string, cors: boolean) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image()
    if (cors) im.crossOrigin = 'anonymous'
    im.onload = () => res(im)
    im.onerror = () => rej(new Error('image'))
    im.src = src
  })

export const DesignStudio: React.FC<{ p: StudioProduct; initial?: SavedDesign | null }> = ({ p, initial }) => {
  const [colourIdx, setColourIdx] = useState(Math.max(0, p.colours.findIndex((c) => c.name === initial?.colour)))
  const [view, setView] = useState<StudioViewKey>(p.views[0].view)
  const [activeArea, setActiveArea] = useState<string>(p.views[0].areas[0]?.key || '')
  const [methodByArea, setMethodByArea] = useState<Record<string, number>>(initial?.methodByArea ?? {})
  const [usedKeys, setUsedKeys] = useState<string[]>([])
  const [sel, setSel] = useState<Sel>(null)
  const [qty, setQty] = useState(Math.max(1, initial?.qty ?? p.minQty))
  const [ar, setAr] = useState(0.8)
  const [ready, setReady] = useState(false)
  const [hist, setHistState] = useState({ undo: false, redo: false })
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState('')
  const [savedToken, setSavedToken] = useState<string | null>(initial?.token ?? null)
  const [saveInfo, setSaveInfo] = useState<{ perPiece: number; total: number } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [copied, setCopied] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [menu, setMenu] = useState<null | 'colour' | 'area' | 'add' | 'method'>(null)
  const [box, setBox] = useState<Box | null>(null)
  const [areaSizes, setAreaSizes] = useState<Record<string, { w: number; h: number }>>({})
  const [printedViews, setPrintedViews] = useState<string[]>([])
  const [orderOpen, setOrderOpen] = useState(true)

  const canvasEl = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<Canvas | null>(null)
  const fabricRef = useRef<Fabric | null>(null)
  const designsRef = useRef<Record<string, string>>({ ...(initial?.views ?? {}) })
  const blobMap = useRef<Record<string, string>>({})
  const armedRef = useRef(false)
  const histRef = useRef<{ stack: string[]; idx: number }>({ stack: [], idx: 0 })
  const loadingRef = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)

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
    const printed: string[] = []
    for (const [v, json] of Object.entries(designsRef.current)) {
      try {
        const objs = JSON.parse(json).objects || []
        if (objs.length) printed.push(v)
        for (const o of objs) if (o.areaKey) keys.add(o.areaKey)
      } catch {}
    }
    setUsedKeys([...keys])
    setPrintedViews(printed)
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
    // Largest printed size (inches) in each print area on this side
    const sizes: Record<string, { w: number; h: number }> = {}
    for (const o of c.getObjects()) {
      const a = areasRef.current.find((x) => x.key === (o as Tagged).areaKey)
      if (!a || !a.widthIn || !a.heightIn) continue
      o.setCoords()
      const br = o.getBoundingRect()
      const { aw, ah } = areaRect(a)
      const w = (br.width / aw) * a.widthIn
      const h = (br.height / ah) * a.heightIn
      const cur = sizes[a.key]
      sizes[a.key] = { w: Math.max(cur?.w || 0, w), h: Math.max(cur?.h || 0, h) }
    }
    setAreaSizes((prev) => {
      const next = { ...prev }
      for (const a of areasRef.current) delete next[a.key]
      return { ...next, ...sizes }
    })
    if (armedRef.current) setDirty(true)
    setHist()
    refreshUsed()
  }, [refreshUsed, setHist])

  const loadJson = useCallback(async (json?: string) => {
    const c = canvasRef.current
    if (!c) return
    loadingRef.current = true
    try {
      if (json) await c.loadFromJSON(withCors(json))
      else c.clear()
      c.discardActiveObject()
      c.requestRenderAll()
    } finally {
      loadingRef.current = false
    }
  }, [])

  /** Works out where the selected element is and how big it will print, in inches. */
  const updateBox = useCallback(() => {
    const c = canvasRef.current
    const o = c?.getActiveObject() as Tagged | undefined
    if (!c || !o) return setBox(null)
    const a = areasRef.current.find((x) => x.key === o.areaKey)
    o.setCoords()
    const br = o.getBoundingRect()
    let wIn: number | null = null
    let hIn: number | null = null
    if (a && a.widthIn && a.heightIn) {
      const { aw, ah } = areaRect(a)
      wIn = (br.width / aw) * a.widthIn
      hIn = (br.height / ah) * a.heightIn
    }
    setBox({ l: br.left, t: br.top, w: br.width, h: br.height, wIn, hIn, areaKey: o.areaKey || '' })
  }, [])

  const syncSel = useCallback(() => {
    const f = fabricRef.current
    const o = canvasRef.current?.getActiveObject()
    if (!f || !o) {
      setBox(null)
      return setSel(null)
    }
    updateBox()
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
      cv.on('object:moving', (e) => {
        constrain(e.target)
        updateBox()
      })
      cv.on('object:scaling', (e) => {
        constrain(e.target)
        updateBox()
      })
      cv.on('object:rotating', (e) => {
        constrain(e.target)
        updateBox()
      })
      cv.on('text:changed', () => updateBox())
      // Clicking an empty spot inside a print area makes it the area new elements go to
      cv.on('mouse:down', (e) => {
        if (e.target) return
        const pt = cv.getScenePoint(e.e)
        const W = cv.getWidth()
        const H = cv.getHeight()
        const hit = areasRef.current.find(
          (a) => pt.x >= (a.x / 100) * W && pt.x <= ((a.x + a.width) / 100) * W && pt.y >= (a.y / 100) * H && pt.y <= ((a.y + a.height) / 100) * H,
        )
        if (hit) setActiveArea(hit.key)
      })
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
      cv.on('selection:cleared', () => {
        setSel(null)
        setBox(null)
      })
      if (!designsRef.current[viewRef.current]) commit()
      refreshUsed()
      armedRef.current = true
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
      setBox(null)
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
      if (file.type === 'image/svg+xml' && UNSAFE_SVG.test(await file.text())) {
        return setNotice('This SVG file contains code we cannot accept. Please export a plain SVG.')
      }
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
    setBox(null)
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

  /* ---------- saving ---------- */

  useEffect(() => {
    if (window.matchMedia('(max-width: 639px)').matches) setOrderOpen(false)
  }, [])

  useEffect(() => {
    if (armedRef.current) setDirty(true)
  }, [qty, methodByArea, colourIdx])

  /** Sends one picture the customer added to R2 and returns its public link. */
  const uploadBlob = async (src: string): Promise<string> => {
    if (blobMap.current[src]) return blobMap.current[src]
    const blob = await (await fetch(src)).blob()
    const type = blob.type || 'image/png'
    const r = await fetch('/api/studio/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: type, size: blob.size }),
    })
    const d = await r.json()
    if (!r.ok) throw new Error(d.error || 'Could not upload your image.')
    let ok = false
    try {
      ok = (await fetch(d.uploadUrl, { method: 'PUT', headers: { 'Content-Type': type }, body: blob })).ok
    } catch {}
    if (!ok) throw new Error('We could not upload your image. Please check your internet and try again.')
    blobMap.current[src] = d.publicUrl
    return d.publicUrl
  }

  /** Draws one side of the product with the design on top, as a picture. */
  const renderPreview = async (v: StudioViewKey, json: string): Promise<string> => {
    const f = fabricRef.current!
    const src = colour.mockups[v] || placeholderShirt(colour.hex, v)
    const draw = async (withMockup: boolean) => {
      const bg = withMockup ? await loadImg(src, true) : null
      const ratio = bg ? bg.naturalWidth / bg.naturalHeight : ar
      const W = 800
      const H = Math.round(W / ratio)
      const sc = new f.StaticCanvas(document.createElement('canvas'), { width: LW, height: Math.round(LW / ratio) })
      await sc.loadFromJSON(withCors(json))
      sc.renderAll()
      const out = document.createElement('canvas')
      out.width = W
      out.height = H
      const ctx = out.getContext('2d')!
      if (bg) ctx.drawImage(bg, 0, 0, W, H)
      ctx.drawImage(sc.toCanvasElement(), 0, 0, W, H)
      sc.dispose()
      return out.toDataURL('image/png')
    }
    try {
      return await draw(true)
    } catch {
      // The product photo could not be read into a picture; save the design on its own instead.
      return draw(false)
    }
  }

  const save = async () => {
    if (saving || !canvasRef.current) return
    if (oversize.length) return setNotice(`${oversize[0].name} is too large for this print method. Make it smaller or choose another method.`)
    setNotice('')
    setSaving('Saving your design…')
    try {
      const views: Record<string, string> = {}
      const previews: Record<string, string> = {}
      for (const [v, json] of Object.entries(designsRef.current)) {
        const parsed = JSON.parse(json)
        if (!parsed.objects?.length) continue
        setSaving('Uploading your images…')
        for (const o of parsed.objects) {
          if (String(o.type).toLowerCase() === 'image' && typeof o.src === 'string' && o.src.startsWith('blob:')) o.src = await uploadBlob(o.src)
        }
        views[v] = JSON.stringify(parsed)
        setSaving('Making your preview…')
        previews[v] = await renderPreview(v as StudioViewKey, json)
      }
      setSaving('Saving your design…')
      const res = await fetch('/api/studio/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: p.slug, token: savedToken, colour: colour.name, qty, views, previews, methodByArea }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not save your design. Please try again.')
      setSavedToken(d.token)
      setSaveInfo({ perPiece: d.perPiece, total: d.total })
      setDirty(false)
      window.history.replaceState(null, '', `?d=${d.token}`)
    } catch (e) {
      setNotice(e instanceof Error && e.message ? e.message : 'Could not save your design. Please try again.')
    } finally {
      setSaving('')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/design/${p.slug}?d=${savedToken}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

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
  const methodNameFor = (key: string) => p.methods.find((m) => m.id === methodFor(key))?.title || ''
  const extraFor = (a: StudioArea) => {
    const m = p.methods.find((x) => x.id === methodFor(a.key))
    return m ? m[a.size] : 0
  }
  // Areas whose design is bigger than the chosen print method allows
  const oversize = usedAreas.filter((a) => {
    const sz = areaSizes[a.key]
    return !!sz && tooBig(sz.w, sz.h, p.methods.find((m) => m.id === methodFor(a.key)))
  })

  /* ---------- screen ---------- */

  const selAreaKey = box?.areaKey || activeArea
  const selArea = allAreas.find((a) => a.key === selAreaKey)
  const selMethod = p.methods.find((m) => m.id === methodFor(selAreaKey))
  const activeAreaObj = areas.find((a) => a.key === activeArea) || areas[0]
  const printedIn = (v: StudioViewKey) => printedViews.includes(v)
  const boxOver = !!box && box.wIn != null && box.hIn != null && tooBig(box.wIn, box.hIn, selMethod)
  const canvasH = Math.round(LW / ar)

  const dots = { backgroundImage: 'radial-gradient(#C8C8CC 1.4px, transparent 1.4px)', backgroundSize: '26px 26px' }
  const bar = 'rounded-full bg-[#3B3C41]/95 text-white shadow-[0_8px_28px_rgba(0,0,0,.28)] backdrop-blur'
  const barBtn =
    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[15px] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent'
  const menuBox = 'absolute left-0 top-[calc(100%+10px)] z-40 min-w-[240px] rounded-2xl bg-[#3B3C41] p-2 text-white shadow-[0_14px_44px_rgba(0,0,0,.4)]'
  const menuRow = 'flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left text-[15px] hover:bg-white/10'
  const whitePill = 'rounded-full bg-white shadow-[0_3px_14px_rgba(0,0,0,.14)]'
  const chev = <span aria-hidden className="text-xs opacity-70">▾</span>

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#EFEFEF] text-ink" style={dots}>
      {menu && <div className="fixed inset-0 z-20" onClick={() => setMenu(null)} aria-hidden />}

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void addImage(f)
          e.target.value = ''
        }}
      />

      {/* Top left: back and logo */}
      <div className={`absolute left-3 top-3 z-30 flex items-center gap-3 py-2.5 pl-4 pr-5 ${whitePill}`}>
        <Link href={`/products/${p.slug}`} aria-label="Back to product" className="text-xl leading-none text-body hover:text-ink">
          ←
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/printribe-logo.png" alt="Printribe" className="h-5 w-auto" />
      </div>

      {/* Top right: link to come back to the design */}
      {savedToken && !dirty && (
        <button type="button" onClick={copyLink} className={`absolute right-3 top-3 z-30 px-5 py-3 text-[15px] font-medium hover:bg-[#F3F4F6] ${whitePill}`}>
          {copied ? 'Link copied' : 'Copy design link'}
        </button>
      )}

      {/* Main toolbar */}
      <div className="absolute left-1/2 top-[68px] z-30 -translate-x-1/2 sm:top-3">
        <div className={`flex items-center gap-0.5 p-1.5 ${bar}`}>
          {/* Colour */}
          <div className="relative">
            <button type="button" className={barBtn} onClick={() => setMenu(menu === 'colour' ? null : 'colour')} aria-label="Product colour">
              <span className="h-5 w-5 rounded-md border border-white/40" style={{ background: colour.hex }} />
              <span className="hidden max-w-[110px] truncate sm:inline">{colour.name}</span>
              {chev}
            </button>
            {menu === 'colour' && (
              <div className={menuBox}>
                {p.colours.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    className={menuRow}
                    onClick={() => {
                      setColourIdx(i)
                      setMenu(null)
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span className="h-5 w-5 rounded-md border border-white/40" style={{ background: c.hex }} />
                      {c.name}
                    </span>
                    {i === colourIdx && <span aria-hidden>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="mx-1 h-6 w-px bg-white/20" />

          {/* Print area */}
          {areas.length > 0 && (
            <div className="relative">
              <button type="button" className={barBtn} onClick={() => setMenu(menu === 'area' ? null : 'area')} aria-label="Print area">
                <span className="max-w-[120px] truncate">{activeAreaObj?.name}</span>
                {chev}
              </button>
              {menu === 'area' && (
                <div className={menuBox}>
                  <p className="px-3 pb-1 pt-1.5 text-xs uppercase tracking-wide text-white/50">New elements go in</p>
                  {areas.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      className={menuRow}
                      onClick={() => {
                        setActiveArea(a.key)
                        setMenu(null)
                      }}
                    >
                      <span>
                        {a.name}
                        {a.widthIn && a.heightIn ? <span className="block text-sm text-white/55">{fmtIn(a.widthIn)} × {fmtIn(a.heightIn)} in</span> : null}
                      </span>
                      {a.key === activeArea && <span aria-hidden>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add element */}
          <div className="relative">
            <button type="button" className={barBtn} onClick={() => setMenu(menu === 'add' ? null : 'add')} disabled={!ready || !areas.length}>
              <span aria-hidden className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">Add element</span>
              {chev}
            </button>
            {menu === 'add' && (
              <div className={menuBox}>
                <button
                  type="button"
                  className={menuRow}
                  onClick={() => {
                    setMenu(null)
                    fileInput.current?.click()
                  }}
                >
                  Image
                </button>
                <button
                  type="button"
                  className={menuRow}
                  onClick={() => {
                    setMenu(null)
                    addText()
                  }}
                >
                  Text
                </button>
              </div>
            )}
          </div>

          <span className="mx-1 hidden h-6 w-px bg-white/20 sm:block" />
          <button type="button" className={barBtn} onClick={duplicate} disabled={!sel} aria-label="Duplicate">
            <span className="hidden sm:inline">Duplicate</span>
            <span className="sm:hidden" aria-hidden>⧉</span>
          </button>
          <button type="button" className={barBtn} onClick={centre} disabled={!sel} aria-label="Centre in print area">
            <span className="hidden sm:inline">Centre</span>
            <span className="sm:hidden" aria-hidden>◎</span>
          </button>
          <button type="button" className={barBtn} onClick={removeSelected} disabled={!sel} aria-label="Delete">
            <span className="hidden sm:inline">Delete</span>
            <span className="sm:hidden" aria-hidden>🗑</span>
          </button>
        </div>
      </div>

      {/* Selected element toolbar */}
      {sel && (
        <div className="absolute left-1/2 top-[124px] z-30 -translate-x-1/2 sm:top-[72px]">
          <div className={`flex items-center gap-1 p-1.5 ${bar}`}>
            <div className="relative">
              <button type="button" className={barBtn} onClick={() => setMenu(menu === 'method' ? null : 'method')} disabled={p.methods.length === 0}>
                <span aria-hidden>✎</span>
                <span className="max-w-[150px] truncate">{selMethod ? selMethod.title : 'Print method'}</span>
                {chev}
              </button>
              {menu === 'method' && (
                <div className={`${menuBox} min-w-[320px]`}>
                  <p className="px-3 pb-1 pt-1.5 text-xs uppercase tracking-wide text-white/50">Print method{selArea ? ` for ${selArea.name}` : ''}</p>
                  {p.methods.map((m) => {
                    const extra = selArea ? m[selArea.size] : 0
                    const over = box && box.wIn != null && box.hIn != null && tooBig(box.wIn, box.hIn, m)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className={menuRow}
                        onClick={() => {
                          if (selAreaKey) setMethodByArea((cur) => ({ ...cur, [selAreaKey]: m.id }))
                          setMenu(null)
                        }}
                      >
                        <span>
                          {m.title}
                          <span className={`block text-sm ${over ? 'text-[#FCA5A5]' : 'text-white/55'}`}>
                            {over ? 'Design is too large for this method' : m.maxWidthIn && m.maxHeightIn ? `Up to ${fmtIn(m.maxWidthIn)} × ${fmtIn(m.maxHeightIn)} in` : 'No size limit'}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 whitespace-nowrap text-[15px]">
                          {rupees(extra)}
                          {m.id === selMethod?.id && <span aria-hidden>✓</span>}
                        </span>
                      </button>
                    )
                  })}
                  <p className="px-3 pb-1.5 pt-1 text-xs text-white/45">Price shown is extra per piece for this print area.</p>
                </div>
              )}
            </div>

            {sel.type === 'text' && (
              <>
                <span className="mx-1 h-6 w-px bg-white/20" />
                <label className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10" aria-label="Text colour">
                  <span className="relative h-5 w-5 overflow-hidden rounded-md border border-white/40" style={{ background: sel.fill }}>
                    <input type="color" value={sel.fill} onChange={(e) => setTextProp('fill', e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                  </span>
                  <span className="hidden sm:inline">Colour</span>
                </label>
                <select
                  value={sel.fontFamily}
                  onChange={(e) => setTextProp('fontFamily', e.target.value)}
                  aria-label="Font"
                  className="max-w-[130px] cursor-pointer rounded-full bg-transparent px-2 py-2 text-[15px] hover:bg-white/10 focus:outline-none"
                >
                  {FONTS.map((f) => (
                    <option key={f} className="text-ink">
                      {f}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={8}
                  max={400}
                  value={sel.fontSize}
                  onChange={(e) => setTextProp('fontSize', Math.max(8, Number(e.target.value) || 8))}
                  aria-label="Font size"
                  className="w-16 rounded-full bg-white/10 px-3 py-1.5 text-[15px] text-white focus:outline-none"
                />
              </>
            )}
          </div>
        </div>
      )}

      {notice && (
        <p role="alert" className="absolute left-1/2 top-[176px] z-30 max-w-[92vw] -translate-x-1/2 rounded-full bg-error px-5 py-2.5 text-center text-sm text-white shadow-lg sm:top-[130px]">
          {notice}
        </p>
      )}

      {/* The product, with the design on it */}
      <div className="absolute inset-0 flex items-center justify-center px-3 pb-[200px] pt-[130px] sm:pb-24 sm:pt-[76px]">
        <div
          className="relative"
          style={{ aspectRatio: String(ar), width: `min(94vw, calc((100dvh - 200px) * ${ar}))`, transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mockupSrc}
            alt={`${p.title}, ${colour.name}, ${VIEW_LABELS[view]}`}
            className="absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_18px_22px_rgba(0,0,0,.18)]"
            draggable={false}
          />
          {areas.map((a) => (
            <div
              key={a.key}
              aria-hidden
              className={`pointer-events-none absolute rounded-sm border-2 border-dashed ${a.key === activeArea ? 'border-sky bg-sky/5' : 'border-[#9CA3AF]'}`}
              style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.width}%`, height: `${a.height}%` }}
            >
              <span className={`absolute -top-5 left-0 whitespace-nowrap text-[11px] ${a.key === activeArea ? 'text-sky' : 'text-[#6B7280]'}`}>
                {a.name}
                {a.widthIn && a.heightIn ? ` · ${fmtIn(a.widthIn)} × ${fmtIn(a.heightIn)} in` : ''}
              </span>
            </div>
          ))}
          {/* Fabric moves the canvas into its own container, so React gets a wrapper it never changes inside */}
          <div className="absolute inset-0">
            <canvas ref={canvasEl} />
          </div>
          {box && box.wIn != null && box.hIn != null && (
            <div
              className={`pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium text-white ${boxOver ? 'bg-error' : 'bg-sky'}`}
              style={{ left: `${((box.l + box.w / 2) / LW) * 100}%`, top: `calc(${((box.t + box.h) / canvasH) * 100}% + 10px)` }}
            >
              {fmtIn(box.wIn)} × {fmtIn(box.hIn)} in
            </div>
          )}
        </div>
      </div>

      {/* Bottom left: zoom, undo, redo */}
      <div className={`absolute bottom-[148px] left-3 z-30 flex items-center gap-0.5 p-1 sm:bottom-3 ${whitePill}`}>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))} disabled={zoom <= 0.6} className="hidden h-9 w-9 rounded-full text-xl hover:bg-[#F3F4F6] disabled:opacity-35 sm:block">
          −
        </button>
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)))} disabled={zoom >= 2} className="hidden h-9 w-9 rounded-full text-xl hover:bg-[#F3F4F6] disabled:opacity-35 sm:block">
          +
        </button>
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <button type="button" aria-label="Undo" onClick={() => step(-1)} disabled={!hist.undo} className="h-9 w-9 rounded-full text-lg hover:bg-[#F3F4F6] disabled:opacity-35">
          ↶
        </button>
        <button type="button" aria-label="Redo" onClick={() => step(1)} disabled={!hist.redo} className="h-9 w-9 rounded-full text-lg hover:bg-[#F3F4F6] disabled:opacity-35">
          ↷
        </button>
      </div>

      {/* Bottom centre: sides */}
      <div className={`absolute bottom-[148px] left-1/2 z-30 flex -translate-x-1/2 gap-1 p-1 sm:bottom-3 ${whitePill}`} role="tablist" aria-label="Product side">
        {p.views.map((v) => (
          <button
            key={v.view}
            type="button"
            role="tab"
            aria-selected={v.view === view}
            aria-label={`${VIEW_LABELS[v.view]}, ${printedIn(v.view) ? 'has a design' : 'no print yet'}`}
            onClick={() => switchView(v.view)}
            className={`rounded-full px-4 py-1.5 text-left ${v.view === view ? 'bg-ink text-white' : 'hover:bg-[#F3F4F6]'}`}
          >
            <span className="block text-[15px] leading-tight">{VIEW_LABELS[v.view]}</span>
            <span className={`block text-[11px] leading-tight ${v.view === view ? 'text-white/60' : 'text-muted-foreground'}`}>{printedIn(v.view) ? 'printed' : 'no print yet'}</span>
          </button>
        ))}
      </div>

      {/* Bottom right: order */}
      <div className="absolute inset-x-3 bottom-3 z-30 rounded-2xl bg-white p-4 shadow-[0_6px_28px_rgba(0,0,0,.18)] sm:inset-x-auto sm:right-3 sm:w-[310px]">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg">Order</h2>
          <button type="button" onClick={() => setOrderOpen((o) => !o)} aria-expanded={orderOpen} aria-label="Show or hide order details" className="flex items-center gap-2 text-[15px]">
            <span className="font-heading text-lg sm:hidden">{!orderOpen && rupees(total)}</span>
            <span aria-hidden className={`text-sm transition-transform ${orderOpen ? '' : 'rotate-180'}`}>▾</span>
          </button>
        </div>

        {orderOpen && (
          <>
            <label className="mt-3 flex items-center justify-between gap-3 text-[15px]">
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
            <dl className="mt-3 space-y-1.5 text-[15px]">
              <div className="flex justify-between text-body">
                <dt>Product</dt>
                <dd>{rupees(base)}</dd>
              </div>
              <div className="flex justify-between text-body">
                <dt>
                  Printing ({usedAreas.length} {usedAreas.length === 1 ? 'area' : 'areas'})
                </dt>
                <dd>{rupees(extras)}</dd>
              </div>
              {usedAreas.map((a) => (
                <div key={a.key} className="flex justify-between pl-3 text-sm text-muted-foreground">
                  <dt>
                    {a.name}
                    {methodNameFor(a.key) ? `, ${methodNameFor(a.key)}` : ''}
                  </dt>
                  <dd>{rupees(extraFor(a))}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 text-body">
                <dt>Per piece</dt>
                <dd>{rupees(perPiece)}</dd>
              </div>
              <div className="font-heading flex justify-between text-lg text-ink">
                <dt>Total ({qty})</dt>
                <dd>{rupees(total)}</dd>
              </div>
            </dl>
            <p className="mt-1 text-xs text-muted-foreground">GST included. Delivery is added at checkout.</p>
          </>
        )}

        {oversize.length > 0 && (
          <p role="alert" className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">
            {oversize[0].name} is too large for {methodNameFor(oversize[0].key) || 'this method'}. Make it smaller or choose another method.
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={!usedKeys.length || !!saving || (!!savedToken && !dirty) || oversize.length > 0}
          className="mt-3 w-full rounded-full bg-sky py-3 text-[16px] font-medium text-white hover:bg-sky/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving || (savedToken && !dirty ? 'Design saved' : 'Save design')}
        </button>
        {orderOpen && (
          <>
            {!usedKeys.length && <p className="mt-2 text-center text-xs text-muted-foreground">Add text or an image to save your design.</p>}
            {savedToken && !dirty && saveInfo && (
              <p className="mt-2 text-center text-sm text-body">
                Confirmed: <strong>{rupees(saveInfo.perPiece)}</strong> per piece, <strong>{rupees(saveInfo.total)}</strong> total.
              </p>
            )}
            <button type="button" disabled className="mt-2 w-full cursor-not-allowed rounded-full bg-ink/20 py-3 text-[16px] font-medium text-white">
              Continue to checkout
            </button>
            <p className="mt-1.5 text-center text-xs text-muted-foreground">Checkout for designs is added in the next step.</p>
          </>
        )}
      </div>
    </div>
  )
}
