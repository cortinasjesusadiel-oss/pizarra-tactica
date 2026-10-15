import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  COLORS, DEFAULT_COLOR, DEFAULT_LOOK, TEAM_COLORS, type Look, type TokenShapeKind, type TokenText, EQUIPMENT, KIND_NAME, PITCH, TOOL_NAME, ballAt, item, player, posAt, uid,
  type Board, type TokenKind, type DrawTool, type Drawing, type PitchKind, type Pt, type Team, type Token, type Tool,
} from './model'
import { Equipment, Markers, TokenShape } from './Shapes'
import { Scene } from './Scene'
import { DEFAULT_PACE, SPEEDS, STEP_SECONDS, caption, paceAt, shownStep, type Pace, type Speed } from './motion'
import { carrier, movesFromArrows } from './steps'
import { SESSIONS } from './sessions'
import { TEMPLATES, emptyBoard } from './templates'
import { GROUPS } from './anim'
import { TIPS } from './tips'
import tpSymbol from './tpSymbol.png'
import { GLOSSARY, LESSONS } from './fundamentos'
import { deletePlay, listPlays, loadLast, saveLast, savePlay, type SavedPlay } from './storage'
import {
  BRAND_MODES, ROLES, endFor, isIdentityMode, loadEnd, loadIdentity, markFor, newProfile, profileLabel, readCrest, saveEnd, saveIdentity,
  type BrandMode, type EndCard, type IdentityStore, type Profile,
} from './identity'
import { IdentityMark } from './Pitch'
import type { ExportOpts, Renderer } from './exportVideo'

const PAD = 3
const DRAW_TOOLS: DrawTool[] = ['pass', 'run', 'dribble', 'zone', 'focus', 'free']
const TOOLS: Tool[] = ['move', ...DRAW_TOOLS, 'erase']

type Action =
  | { kind: 'move'; id: string; dx: number; dy: number; ball?: { id: string; ox: number; oy: number } }
  | { kind: 'draw'; drawing: Drawing }
  | { kind: 'erase' }
  | { kind: 'none' }

function hint(): boolean {
  try { return !localStorage.getItem('pizarra.ayuda.v2') } catch { return true }
}

const ease = (k: number) => k * k * (3 - 2 * k)
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export default function App() {
  const [board, setBoard] = useState<Board>(() => loadLast() ?? TEMPLATES.find((t) => t.animated)!.build())
  const past = useRef<Board[]>([])
  const future = useRef<Board[]>([])
  const [, force] = useState(0)

  const [tool, setTool] = useState<Tool>('move')
  const [penTool, setPenTool] = useState<DrawTool>('pass')
  const [color, setColor] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [live, setLive] = useState<Drawing | null>(null)
  const [penSeen, setPenSeen] = useState(false)
  const [sheet, setSheet] = useState<'templates' | 'plays' | 'material' | 'sessions' | 'tips' | 'export' | 'learn' | 'look' | 'identity' | null>(null)
  const [showHint, setShowHint] = useState(hint)
  const [toast, setToast] = useState<string | null>(null)
  const [zones, setZones] = useState(() => { try { return localStorage.getItem('pizarra.zonas') === '1' } catch { return false } })
  const toggleZones = () => setZones((z) => { try { localStorage.setItem('pizarra.zonas', z ? '0' : '1') } catch { /* sin almacenamiento */ } return !z })

  // Animación
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  // Instante de la animación en pasos (1.5 = a mitad entre el paso 2 y el 3). null = quieto en `step`.
  const [anim, setAnimState] = useState<number | null>(null)
  const animRef = useRef<number | null>(null)
  const setAnim = (s: number | null) => { animRef.current = s; setAnimState(s) }
  const raf = useRef(0)
  const [video, setVideo] = useState<number | null>(null)

  const stage = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const layer = useRef<SVGGElement>(null)
  const pendingSel = useRef<string | null | undefined>(undefined)
  const [size, setSize] = useState({ w: 1, h: 1 })
  const action = useRef<Action>({ kind: 'none' })
  const pointer = useRef<number | null>(null)
  const penDown = useRef(false)
  const startSnap = useRef<string>('')

  const frames = board.frames
  const nFrames = frames?.length ?? 0
  const cur = Math.min(step, Math.max(0, nFrames - 1))
  const { w: W, h: H } = PITCH[board.pitch]
  // Se gira el campo si así cabe más grande en la pantalla (móvil en vertical).
  const scaleH = Math.min(size.w / (W + 2 * PAD), size.h / (H + 2 * PAD))
  const scaleV = Math.min(size.w / (H + 2 * PAD), size.h / (W + 2 * PAD))
  const vertical = scaleV > scaleH * 1.08

  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => { saveLast(board) }, [board])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const stopAnim = useCallback(() => {
    cancelAnimationFrame(raf.current)
    if (animRef.current !== null) setStep(Math.round(animRef.current))
    animRef.current = null
    setAnimState(null)
    setPlaying(false)
  }, [])

  const commit = useCallback((next: Board | ((b: Board) => Board)) => {
    setBoard((b) => {
      const n = typeof next === 'function' ? next(b) : next
      past.current.push(b)
      if (past.current.length > 100) past.current.shift()
      future.current = []
      return n
    })
    force((x) => x + 1)
  }, [])

  // Cargar una pizarra nueva (plantilla, jugada guardada o campo vacío).
  const load = useCallback((b: Board) => {
    stopAnim()
    commit(b)
    setStep(0)
    setSelected(null)
  }, [commit, stopAnim])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    stopAnim()
    setBoard((b) => { future.current.push(b); return prev })
    setSelected(null)
    force((x) => x + 1)
  }, [stopAnim])
  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    stopAnim()
    setBoard((b) => { past.current.push(b); return next })
    force((x) => x + 1)
  }, [stopAnim])

  const removeSelected = useCallback(() => {
    if (!selected) return
    commit((b) => ({ ...b, tokens: b.tokens.filter((t) => t.id !== selected) }))
    setSelected(null)
  }, [selected, commit])

  // Desliza las fichas desde donde están ahora hasta el paso `to`, pasando por los pasos intermedios.
  const glide = (to: number) => {
    cancelAnimationFrame(raf.current)
    setPlaying(false)
    const from = animRef.current ?? cur
    if (from === to || reduced()) { setAnim(null); setStep(to); return }
    const dur = Math.min(2200, Math.max(700, Math.abs(to - from) * 900))
    const t0 = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      if (k < 1) { setAnim(from + (to - from) * ease(k)); raf.current = requestAnimationFrame(tick) }
      else { setAnim(null); setStep(to) }
    }
    raf.current = requestAnimationFrame(tick)
  }

  // Ritmo elegido (segundos por paso y velocidad), guardado en el dispositivo. Vale para reproducir y para el vídeo.
  const [pace, setPaceState] = useState<Pace>(() => {
    try { return { ...DEFAULT_PACE, ...JSON.parse(localStorage.getItem('pizarra.ritmo') ?? '{}') } } catch { return DEFAULT_PACE }
  })
  const setPace = (patch: Partial<Pace>) => setPaceState((p) => {
    const next = { ...p, ...patch }
    try { localStorage.setItem('pizarra.ritmo', JSON.stringify(next)) } catch { /* sin almacenamiento */ }
    return next
  })

  // Reproducción de principio a fin: en cada paso las fichas se paran para leer y luego van al siguiente.
  const startPlay = (fromStart = false) => {
    if (nFrames < 2) return
    cancelAnimationFrame(raf.current)
    setSelected(null)
    const start = fromStart || cur >= nFrames - 1 ? 0 : (animRef.current ?? cur)
    if (reduced()) { setAnim(null); setStep(nFrames - 1); return }
    setPlaying(true)
    setStep(Math.floor(start))
    setAnim(start)
    // Si se reanuda a mitad, se sigue desde el inicio del paso en el que estaba.
    const t0 = performance.now() - Math.floor(start) * pace.step * 1000
    const tick = (now: number) => {
      const s = Math.max(start, paceAt(nFrames, pace, (now - t0) / 1000))
      if (s < nFrames - 1) { setAnim(s); raf.current = requestAnimationFrame(tick) }
      else { setAnim(null); setStep(nFrames - 1); setPlaying(false) }
    }
    raf.current = requestAnimationFrame(tick)
  }
  // Al abrir una plantilla animada se reproduce sola (cuando ya está cargada).
  const [autoplay, setAutoplay] = useState(false)
  const playRef = useRef(startPlay)
  playRef.current = startPlay
  useEffect(() => {
    if (!autoplay) return
    setAutoplay(false)
    playRef.current(true)
  }, [autoplay, board])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const play = () => {
    // Pausa: termina de llegar al paso que estaba en camino.
    if (playing) { glide(Math.ceil((animRef.current ?? cur) - 1e-6)); return }
    startPlay()
  }
  const nextStep = () => glide(Math.min(nFrames - 1, Math.floor((animRef.current ?? cur) + 1e-6) + 1))
  const prevStep = () => glide(Math.max(0, Math.ceil((animRef.current ?? cur) - 1e-6) - 1))

  // Aspecto de las fichas (forma, número/nombre y colores de cada equipo), guardado en el dispositivo.
  const [look, setLookState] = useState<Look>(() => {
    try { return { ...DEFAULT_LOOK, ...JSON.parse(localStorage.getItem('pizarra.fichas') ?? '{}') } } catch { return DEFAULT_LOOK }
  })
  const setLook = (patch: Partial<Look>) => setLookState((l) => {
    const n = { ...l, ...patch }
    try { localStorage.setItem('pizarra.fichas', JSON.stringify(n)) } catch { /* sin almacenamiento */ }
    return n
  })
  useEffect(() => {
    document.documentElement.style.setProperty('--home', look.home)
    document.documentElement.style.setProperty('--away', look.away)
  }, [look.home, look.away])

  // Marca de agua (por defecto TacticalPro); vacía = sin marca.
  const [brand, setBrandState] = useState(() => { try { return localStorage.getItem('pizarra.marca') ?? 'TacticalPro' } catch { return 'TacticalPro' } })
  const setBrand = (v: string) => { setBrandState(v); try { localStorage.setItem('pizarra.marca', v) } catch { /* sin almacenamiento */ } }
  // Tipo de marca: el logo del autor (por defecto), un texto o ninguna.
  const [brandMode, setBrandModeState] = useState<BrandMode>(() => { try { return (localStorage.getItem('pizarra.marca.tipo') as BrandMode) || 'logo' } catch { return 'logo' } })
  const setBrandMode = (m: BrandMode) => { setBrandModeState(m); try { localStorage.setItem('pizarra.marca.tipo', m) } catch { /* sin almacenamiento */ } }
  const mark = brandMode === 'logo' ? 'logo' : brandMode === 'text' ? brand.trim() || undefined : undefined

  // Mi identidad: perfiles del entrenador (nombre, cargo, club, escudo, eslogan) y el mensaje final de los vídeos.
  const [idStore, setIdStoreState] = useState<IdentityStore>(loadIdentity)
  const setIdStore = (f: (s: IdentityStore) => IdentityStore) => setIdStoreState((s) => {
    const next = f(s)
    if (!saveIdentity(next)) setToast('No se pudo guardar en el dispositivo: prueba con un escudo más ligero')
    return next
  })
  const profile = idStore.profiles.find((p) => p.id === idStore.active) ?? null
  const ident = useMemo(() => (isIdentityMode(brandMode) ? markFor(brandMode, profile) : null), [brandMode, profile])
  const [endCard, setEndState] = useState<EndCard>(loadEnd)
  const setEnd = (patch: Partial<EndCard>) => setEndState((e) => { const next = { ...e, ...patch }; saveEnd(next); return next })
  // La frase se puede cambiar solo para el próximo vídeo sin tocar la guardada.
  const [oncePhrase, setOncePhrase] = useState<string | null>(null)
  const endView = useMemo(() => endFor(endCard, profile, oncePhrase ?? endCard.phrase), [endCard, profile, oncePhrase])
  const [preview, setPreview] = useState(false)

  // Exportar: los vídeos se crean fotograma a fotograma; al terminar se ofrece compartir (WhatsApp, etc.) o guardar.
  const [ready, setReady] = useState<File[] | null>(null)
  const [progressLabel, setProgressLabel] = useState('')
  // Opciones del vídeo, guardadas en el dispositivo: letra grande para el móvil y pantalla final con el logo.
  const [vopts, setVoptsState] = useState<VideoOpts>(() => {
    try { return { big: false, outro: false, ...JSON.parse(localStorage.getItem('pizarra.video') ?? '{}') } } catch { return { big: false, outro: false } }
  })
  const setVopts = (patch: Partial<VideoOpts>) => setVoptsState((v) => {
    const next = { ...v, ...patch }
    try { localStorage.setItem('pizarra.video', JSON.stringify(next)) } catch { /* sin almacenamiento */ }
    return next
  })
  const exportOpts: ExportOpts = useMemo(() => ({ zones, brand: mark, look, pace, ...vopts, ident, end: endView }), [zones, mark, look, pace, vopts, ident, endView])
  const runExport = async (items: { name: string; board: Board }[], image = false) => {
    if (video !== null || !items.length) return
    stopAnim()
    setSheet(null)
    setVideo(0)
    try {
      const ex = await import('./exportVideo')
      const opts = exportOpts
      let files: File[]
      if (image) files = [await ex.exportImage(items[0].board, { ...opts, s: cur })]
      else if (items.length === 1 && items[0].board.frames) {
        const res = await ex.exportVideo(items[0].board, { ...opts, onProgress: setVideo })
        if (res === 'unsupported') { setToast('Este navegador no puede crear vídeo. Prueba con Chrome actualizado.'); return }
        files = [res.file]
        setOncePhrase(null)
      } else {
        let idx = 0
        files = await ex.exportMany(items, {
          ...opts,
          onItem: (i) => { idx = i; setProgressLabel(`${i + 1} de ${items.length}: `) },
          onProgress: (k) => setVideo((idx + k) / items.length),
        })
      }
      setReady(files)
    } catch (e) {
      // El motivo se enseña para poder arreglarlo si vuelve a pasar.
      console.error(e)
      setToast(`No se pudo exportar: ${e instanceof Error ? e.message : String(e)}`.slice(0, 160))
    } finally {
      setVideo(null)
      setProgressLabel('')
    }
  }
  const doVideo = () => runExport([{ name: 'jugada', board }])
  const shareReady = async () => {
    if (!ready) return
    const { shareFiles, saveFiles } = await import('./exportVideo')
    if (await shareFiles(ready)) { setReady(null); return }
    try { await saveFiles(ready); setToast(ready.length > 1 ? 'Archivos guardados' : 'Archivo guardado'); setReady(null) } catch { setToast('No se pudo guardar') }
  }
  const saveReady = async () => {
    if (!ready) return
    const { saveFiles } = await import('./exportVideo')
    try { await saveFiles(ready); setToast(ready.length > 1 ? 'Archivos guardados' : 'Archivo guardado'); setReady(null) } catch { setToast('No se pudo guardar') }
  }

  // Paso nuevo: cada jugador va solo al final de su flecha (carrera o conducción) y el balón al final del pase.
  // Las flechas dibujadas antes de tener pasos pasan a ser las del primer paso.
  const addStep = () => {
    stopAnim()
    const b = board
    const isArrow = (d: Drawing) => d.type === 'pass' || d.type === 'run' || d.type === 'dribble'
    const first = b.frames ? null : b.drawings.filter(isArrow)
    const f = b.frames ?? [{ pos: {}, drawings: first!, note: '' }]
    const pos = movesFromArrows({ ...b, frames: f }, cur, f[cur].drawings)
    commit({
      ...b,
      drawings: first ? b.drawings.filter((d) => !isArrow(d)) : b.drawings,
      frames: [...f.slice(0, cur + 1), { pos, drawings: [], note: '' }, ...f.slice(cur + 1)],
    })
    setStep(nFrames ? cur + 1 : 1)
    setToast(Object.keys(pos).length ? 'Paso añadido: cada ficha ya está al final de su flecha' : 'Paso añadido: mueve las fichas o dibuja flechas y pulsa + Paso')
  }
  const removeStep = () => {
    if (!frames) return
    stopAnim()
    if (nFrames <= 2) { commit((b) => ({ ...b, frames: undefined })); setStep(0); return }
    if (cur === 0) {
      // Al quitar el primer paso, el segundo pasa a ser la posición inicial.
      commit((b) => ({
        ...b,
        tokens: b.tokens.map((t) => { const p = posAt(b, t, 1); return { ...t, x: p[0], y: p[1] } }),
        frames: b.frames!.slice(1).map((f, i) => (i === 0 ? { ...f, pos: {} } : f)),
      }))
    } else {
      commit((b) => ({ ...b, frames: b.frames!.filter((_, i) => i !== cur) }))
      setStep(cur - 1)
    }
  }
  const setNote = (note: string) =>
    commit((b) => ({ ...b, frames: b.frames!.map((f, i) => (i === cur ? { ...f, note } : f)) }))

  // Modo proyector: la pizarra a pantalla completa para la charla. Se maneja con las flechas,
  // con un mando de presentaciones (envía Av Pág / Re Pág) o tocando a los lados de la pantalla.
  const [present, setPresent] = useState(false)
  const presentRef = useRef<HTMLDivElement>(null)
  const openPresent = () => {
    setSheet(null); setSelected(null); setPresent(true)
    requestAnimationFrame(() => presentRef.current?.requestFullscreen?.().catch(() => { /* sin pantalla completa */ }))
  }
  const closePresent = () => {
    setPresent(false)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => { /* ya salió */ })
  }
  useEffect(() => {
    if (!present) return
    const onFs = () => { if (!document.fullscreenElement) setPresent(false) }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [present])
  const presentKeys = useRef({ nextStep, prevStep, play, closePresent })
  presentKeys.current = { nextStep, prevStep, play, closePresent }
  useEffect(() => {
    if (!present) return
    const onKey = (e: KeyboardEvent) => {
      const k = presentKeys.current
      if (['ArrowRight', 'ArrowDown', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); k.nextStep() }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); k.prevStep() }
      else if (e.key === ' ' || e.key.toLowerCase() === 'p') { e.preventDefault(); k.play() }
      else if (e.key === 'Escape') k.closePresent()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [present])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || document.querySelector('.present')) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo() }
      else if (e.key === 'Delete' || e.key === 'Backspace') removeSelected()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, removeSelected])

  const toBoard = (e: React.PointerEvent): Pt => {
    const m = layer.current!.getScreenCTM()!.inverse()
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
    return [p.x, p.y]
  }
  const widthFor = (e: React.PointerEvent) => {
    const p = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5
    return +(0.22 + p * 0.4).toFixed(2)
  }

  const eraseAt = (cx: number, cy: number) => {
    const el = document.elementFromPoint(cx, cy)
    const d = el?.closest('[data-draw]')?.getAttribute('data-draw')
    const t = el?.closest('[data-token]')?.getAttribute('data-token')
    if (d) setBoard((b) => ({
      ...b,
      drawings: b.drawings.filter((x) => x.id !== d),
      frames: b.frames?.map((f) => ({ ...f, drawings: f.drawings.filter((x) => x.id !== d) })),
    }))
    else if (t) setBoard((b) => ({ ...b, tokens: b.tokens.filter((x) => x.id !== t) }))
  }

  const onDown = (e: React.PointerEvent) => {
    if (pointer.current !== null) return
    const isPen = e.pointerType === 'pen'
    // Con el lápiz apoyado se ignora la palma de la mano.
    if (e.pointerType === 'touch' && penDown.current) return
    if (isPen && !penSeen) setPenSeen(true)
    if (playing || anim !== null) stopAnim()
    const tokenId = (e.target as Element).closest('[data-token]')?.getAttribute('data-token') ?? null
    const p = toBoard(e)
    // Botón lateral del S Pen (2) o goma del lápiz (32): borrar.
    const penErase = isPen && (e.buttons & 2 || e.buttons & 32)
    const fingerWithPen = penSeen && e.pointerType === 'touch'

    let mode: 'move' | 'draw' | 'erase' = 'move'
    let drawTool: DrawTool = penTool
    if (penErase || tool === 'erase') mode = 'erase'
    else if (isPen) {
      // Lápiz en modo Mover: sobre una ficha la mueve, sobre el césped dibuja.
      if (tool === 'move') mode = tokenId ? 'move' : 'draw'
      else { mode = 'draw'; drawTool = tool }
    } else if (fingerWithPen) mode = 'move'
    else if (tool !== 'move') { mode = 'draw'; drawTool = tool }

    pointer.current = e.pointerId
    if (isPen) penDown.current = true
    try { svg.current?.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
    past.current.push(board)
    future.current = []
    startSnap.current = JSON.stringify(board)

    if (mode === 'move') {
      const t = board.tokens.find((x) => x.id === tokenId)
      // La barra de la ficha aparece al soltar: si apareciera ya, la pizarra se movería bajo el dedo.
      pendingSel.current = t ? t.id : null
      if (t) {
        const [x, y] = posAt(board, t, cur)
        // Si mueves al jugador que lleva el balón, el balón va pegado a él.
        const ball = t.kind === 'player' && carrier(board, cur)?.id === t.id ? board.tokens.find((k) => k.kind === 'ball') : undefined
        const bp = ball ? posAt(board, ball, cur) : null
        action.current = { kind: 'move', id: t.id, dx: x - p[0], dy: y - p[1], ball: ball && bp ? { id: ball.id, ox: bp[0] - x, oy: bp[1] - y } : undefined }
      } else action.current = { kind: 'none' }
    } else if (mode === 'draw') {
      setSelected(null)
      const drawing: Drawing = { id: uid(), type: drawTool, color: color ?? DEFAULT_COLOR[drawTool], width: widthFor(e), points: [p] }
      action.current = { kind: 'draw', drawing }
      setLive(drawing)
    } else {
      action.current = { kind: 'erase' }
      eraseAt(e.clientX, e.clientY)
    }
  }

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerId !== pointer.current) return
    const a = action.current
    if (a.kind === 'move') {
      const [x, y] = toBoard(e)
      const nx = Math.max(-2, Math.min(W + 2, x + a.dx)), ny = Math.max(-2, Math.min(H + 2, y + a.dy))
      const set: Record<string, Pt> = { [a.id]: [nx, ny] }
      if (a.ball) set[a.ball.id] = [nx + a.ball.ox, ny + a.ball.oy]
      setBoard((b) => {
        // En el paso 0 se mueve la posición inicial; en los demás, solo la de ese paso.
        if (b.frames && cur > 0)
          return { ...b, frames: b.frames.map((f, i) => (i === cur ? { ...f, pos: { ...f.pos, ...set } } : f)) }
        return { ...b, tokens: b.tokens.map((t) => (set[t.id] ? { ...t, x: set[t.id][0], y: set[t.id][1] } : t)) }
      })
    } else if (a.kind === 'draw') {
      const p = toBoard(e)
      const pts = a.drawing.points
      const last = pts[pts.length - 1]
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.35) return
      const width = e.pointerType === 'pen' ? +(a.drawing.width * 0.8 + widthFor(e) * 0.2).toFixed(2) : a.drawing.width
      a.drawing = { ...a.drawing, width, points: a.drawing.type === 'pass' || a.drawing.type === 'zone' ? [pts[0], p] : [...pts, p] }
      setLive(a.drawing)
    } else if (a.kind === 'erase') {
      eraseAt(e.clientX, e.clientY)
    }
  }

  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointer.current) return
    pointer.current = null
    if (e.pointerType === 'pen') penDown.current = false
    const a = action.current
    action.current = { kind: 'none' }
    if (pendingSel.current !== undefined) { setSelected(pendingSel.current); pendingSel.current = undefined }
    if (a.kind === 'draw') {
      setLive(null)
      const p = a.drawing.points
      const [x0, y0] = p[0], [x1, y1] = p[p.length - 1]
      const ok = a.drawing.type === 'zone' ? Math.abs(x1 - x0) > 1 && Math.abs(y1 - y0) > 1 : p.length > 1 && Math.hypot(x1 - x0, y1 - y0) > 1
      if (ok) {
        setBoard((b) => (b.frames
          ? { ...b, frames: b.frames.map((f, i) => (i === cur ? { ...f, drawings: [...f.drawings, a.drawing] } : f)) }
          : { ...b, drawings: [...b.drawings, a.drawing] }))
      } else past.current.pop()
    } else if (JSON.stringify(board) === startSnap.current) past.current.pop()
    force((x) => x + 1)
  }

  const addToken = (kind: 'home' | 'away' | TokenKind) => {
    const jitter = () => (Math.random() - 0.5) * 4
    const cx = W / 2 + jitter(), cy = H / 2 + jitter()
    let t: Token
    if (kind === 'ball') t = ballAt(cx, cy)
    else if (kind !== 'home' && kind !== 'away') t = item(kind, cx, cy)
    else {
      const used = new Set(board.tokens.filter((x) => x.team === kind).map((x) => x.label))
      let n = 1
      while (used.has(String(n))) n++
      t = player(kind, String(n), cx, cy)
    }
    // Una ficha nueva aparece en todos los pasos en la misma posición hasta que la muevas.
    commit((b) => ({ ...b, tokens: [...b.tokens, t] }))
    setSelected(t.id)
    setTool('move')
  }

  // Empezar de cero: pizarra vacía con el mismo campo. Se puede deshacer con ↶.
  const newBoard = () => {
    load(emptyBoard(board.pitch))
    setToast('Pizarra vacía. Si no querías borrarla, pulsa ↶')
  }

  const setPitch = (pitch: PitchKind) => {
    if (pitch === board.pitch) return
    load(emptyBoard(pitch))
  }

  const sel = board.tokens.find((t) => t.id === selected) ?? null
  const updateSel = (patch: Partial<Token>) =>
    commit((b) => ({ ...b, tokens: b.tokens.map((t) => (t.id === selected ? { ...t, ...patch } : t)) }))

  const pickTool = (t: Tool) => {
    setTool(t)
    if (t !== 'move' && t !== 'erase') setPenTool(t)
    setColor(null)
  }

  const vb = vertical
    ? `${-PAD} ${-PAD} ${H + 2 * PAD} ${W + 2 * PAD}`
    : `${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`
  const activeDraw = tool === 'move' || tool === 'erase' ? penTool : tool
  const shown = anim !== null ? shownStep(board, anim) : cur
  const cap = anim !== null ? caption(board, anim) : { k: cur, prev: cur, fade: 1 }
  const stepDrawings = frames ? frames[cur].drawings : []

  return (
    <div className="app">
      <header className="top">
        <strong className="brand"><img src={tpSymbol} alt="" />Tactical<span>Pro</span></strong>
        <button className="primary" onClick={newBoard}>+ Nueva</button>
        <div className="seg" role="group" aria-label="Tipo de campo">
          {(Object.keys(PITCH) as PitchKind[]).map((k) => (
            <button key={k} className={board.pitch === k ? 'on' : ''} onClick={() => setPitch(k)}>
              {k === 'full' ? 'Campo' : k === 'half' ? 'Medio' : '40×30'}
            </button>
          ))}
        </div>
        <button onClick={() => setSheet('learn')}>Fundamentos</button>
        <button onClick={() => setSheet('templates')}>Plantillas</button>
        <button onClick={() => setSheet('sessions')}>Sesiones</button>
        <button onClick={() => setSheet('tips')}>Consejos</button>
        <button onClick={() => setSheet('look')}>Fichas</button>
        <button onClick={() => setSheet('identity')}>Mi identidad</button>
        <button className={zones ? 'toggle on' : 'toggle'} onClick={toggleZones} aria-pressed={zones}>Zonas</button>
        <span className="sep" />
        <button className="chip home" onClick={() => addToken('home')} aria-label="Añadir jugador local">+ Local</button>
        <button className="chip away" onClick={() => addToken('away')} aria-label="Añadir jugador rival">+ Rival</button>
        <button onClick={() => addToken('ball')}>+ Balón</button>
        <button onClick={() => setSheet('material')}>+ Material</button>
        <span className="sep" />
        <button onClick={undo} disabled={!past.current.length} aria-label="Deshacer">↶</button>
        <button onClick={redo} disabled={!future.current.length} aria-label="Rehacer">↷</button>
        <button onClick={() => setSheet('plays')}>Jugadas</button>
        <button onClick={openPresent}>Proyectar</button>
        <button onClick={() => setSheet('export')}>Exportar</button>
      </header>

      <main className="stage" ref={stage}>
        <svg
          ref={svg}
          viewBox={vb}
          className={`board tool-${tool}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Markers />
          <g ref={layer} transform={vertical ? `translate(${H} 0) rotate(90)` : undefined}>
            <Scene board={board} s={anim ?? cur} zones={zones} brand={mark} ident={ident} look={look} upright={vertical} selected={selected} live={live} ghost={anim === null && !playing} />
          </g>
        </svg>
        {frames && frames[shown].note && !showHint && (
          <div className="note" aria-live="polite"><b>Paso {shown + 1}.</b> {frames[shown].note}</div>
        )}
        {video !== null && (
          <div className="toast" role="status">Exportando {progressLabel}{Math.round(video * 100)}%</div>
        )}
        {showHint && (
          <div className="hint" role="note">
            <p><b>S Pen:</b> toca una ficha con el lápiz para moverla y toca el césped para dibujar. Mantén el botón lateral para borrar.</p>
            <p><b>Animaciones:</b> abre Plantillas y elige una marcada con ▶. Luego pulsa Reproducir.</p>
            <button onClick={() => { setShowHint(false); try { localStorage.setItem('pizarra.ayuda.v2', '1') } catch { /* sin almacenamiento */ } }}>Entendido</button>
          </div>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
        {ready && (
          <div className="videoready" role="dialog" aria-label="Exportación lista">
            <b>{ready.length > 1 ? `${ready.length} archivos listos` : ready[0].type === 'image/png' ? 'Imagen lista' : 'Vídeo listo'}</b>
            <button className="primary" onClick={shareReady}>Compartir</button>
            <button onClick={saveReady}>Guardar</button>
            <button onClick={() => setReady(null)} aria-label="Cerrar">✕</button>
          </div>
        )}
      </main>

      {sel && !playing && (
        <div className="selbar">
          <span className="muted">{KIND_NAME(sel.kind)}</span>
          {sel.kind === 'player' && (
            <>
              <label className="field">
                Dorsal
                <input id="dorsal" value={sel.label} maxLength={3} onChange={(e) => updateSel({ label: e.target.value.toUpperCase() })} />
              </label>
              <label className="field">
                Nombre
                <input id="nombre" className="name-input" value={sel.name ?? ''} maxLength={14} placeholder="Opcional" onChange={(e) => updateSel({ name: e.target.value })} />
              </label>
              <div className="seg" role="group" aria-label="Equipo">
                {(['home', 'away', 'neutral'] as Team[]).map((tm) => (
                  <button key={tm} className={sel.team === tm ? 'on' : ''} onClick={() => updateSel({ team: tm })}>
                    {tm === 'home' ? 'Local' : tm === 'away' ? 'Rival' : 'Comodín'}
                  </button>
                ))}
              </div>
            </>
          )}
          {sel.kind !== 'player' && sel.kind !== 'ball' && (
            <button onClick={() => updateSel({ rot: ((sel.rot ?? 0) + 45) % 360 })}>Girar 45°</button>
          )}
          <button className="danger" onClick={removeSelected}>Eliminar</button>
        </div>
      )}
      <div className="animbar">
          {frames ? (
            <>
              <button className="primary" onClick={play} aria-label={playing ? 'Pausa' : 'Reproducir'}>{playing ? '❚❚ Pausa' : '▶ Reproducir'}</button>
              <button onClick={prevStep} disabled={cur === 0} aria-label="Paso anterior">‹</button>
              <div className="steps" role="group" aria-label="Pasos de la animación">
                {frames.map((_, i) => (
                  <button key={i} className={i === shown ? 'on' : ''} aria-label={`Ir al paso ${i + 1}`} onClick={() => glide(i)}>{i + 1}</button>
                ))}
              </div>
              <button onClick={nextStep} disabled={cur >= nFrames - 1} aria-label="Paso siguiente">›</button>
              <span className="sep" />
              <input id="step-note" className="noteinput" placeholder="Explica este paso" value={frames[cur].note} onChange={(e) => setNote(e.target.value)} />
              <button onClick={addStep}>+ Paso</button>
              <button onClick={removeStep}>Quitar paso</button>
              <label className="pace">
                <span className="muted small">Cada paso</span>
                <select value={pace.step} onChange={(e) => setPace({ step: +e.target.value })} aria-label="Segundos por paso">
                  {STEP_SECONDS.map((x) => <option key={x} value={x}>{x} s</option>)}
                </select>
              </label>
              <label className="pace">
                <span className="muted small">Velocidad</span>
                <select value={pace.speed} onChange={(e) => setPace({ speed: e.target.value as Speed })} aria-label="Velocidad del movimiento">
                  {SPEEDS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <button onClick={() => setSheet('export')} disabled={video !== null}>Exportar vídeo</button>
            </>
          ) : (
            <>
              <span className="muted small">Para animar: coloca las fichas en su posición inicial y pulsa “+ Paso”. Después mueve las fichas a donde van en ese paso.</span>
              <button onClick={addStep}>+ Paso</button>
            </>
          )}
      </div>

      <footer className="tools">
        <div className="seg big" role="group" aria-label="Herramienta">
          {TOOLS.map((t) => (
            <button key={t} className={tool === t ? 'on' : ''} onClick={() => pickTool(t)} aria-pressed={tool === t}>
              <ToolIcon t={t} />
              <span>{TOOL_NAME[t]}</span>
            </button>
          ))}
        </div>
        <div className="colors" role="group" aria-label="Color del trazo">
          {COLORS.map((c) => (
            <button key={c} aria-label={`Color ${c}`} className={(color ?? DEFAULT_COLOR[activeDraw]) === c ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        <button
          onClick={() => commit((b) => ({ ...b, drawings: [], frames: b.frames?.map((f, i) => (i === cur ? { ...f, drawings: [] } : f)) }))}
          disabled={!board.drawings.length && !stepDrawings.length}
        >Borrar trazos</button>
        {penSeen && <span className="pen">S Pen · ficha: mover · césped: {TOOL_NAME[activeDraw]}</span>}
      </footer>

      {sheet === 'templates' && (
        <Sheet title="Plantillas" onClose={() => setSheet(null)}>
          {GROUPS.map((g) => {
            const list = TEMPLATES.filter((t) => t.group === g.id)
            return (
              <details key={g.id} className="session" open={g.id === 'Bloques'}>
                <summary><b>{g.name}</b><span className="muted small">{list.length}</span></summary>
                <div className="list">
                  {list.map((t) => (
                    <button key={t.id} className="row" onClick={() => { load(t.build()); setSheet(null); if (t.animated) setAutoplay(true) }}>
                      {t.animated && <span className="anim-badge">▶</span>}{t.name}
                    </button>
                  ))}
                </div>
              </details>
            )
          })}
          <p className="muted small">▶ = jugada animada paso a paso.</p>
        </Sheet>
      )}
      {sheet === 'material' && (
        <Sheet title="Material de entrenamiento" onClose={() => setSheet(null)}>
          <div className="material">
            {EQUIPMENT.map((e) => (
              <button key={e.kind} onClick={() => { addToken(e.kind); setSheet(null) }}>
                <svg viewBox={e.kind === 'goal' ? '-4.5 -4.5 9 9' : e.kind === 'ladder' ? '-2.4 -2.4 4.8 4.8' : '-1.4 -1.4 2.8 2.8'} width="44" height="44" aria-hidden="true">
                  <rect x="-10" y="-10" width="20" height="20" fill="var(--pitch)" />
                  <Equipment kind={e.kind} r={1.1} />
                </svg>
                <span>{e.name}</span>
              </button>
            ))}
          </div>
          <p className="muted small">Toca un elemento para ponerlo en el centro del campo. Luego arrástralo y usa “Girar 45°” para orientarlo.</p>
        </Sheet>
      )}
      {sheet === 'sessions' && (
        <Sheet title="Sesiones sugeridas" onClose={() => setSheet(null)}>
          <p className="muted small">Sesiones de fútbol 11 de adultos. MD-3 significa 3 días antes del partido. Toca un bloque con ▶ para abrir su ejercicio animado.</p>
          {SESSIONS.map((ses) => (
            <details key={ses.id} className="session">
              <summary>
                <b>{ses.name}</b>
                <span className="muted small">{ses.day} · {ses.blocks.reduce((a, x) => a + x.minutes, 0)} min</span>
              </summary>
              <p className="small">{ses.goal}</p>
              <ol className="blocks">
                {ses.blocks.map((bl, i) => {
                  const tpl = TEMPLATES.find((t) => t.id === bl.template)
                  return (
                    <li key={i}>
                      {tpl ? (
                        <button className="row" onClick={() => { load(tpl.build()); setSheet(null); if (tpl.animated) setAutoplay(true) }}>
                          <span><span className="anim-badge">▶</span><b>{bl.title}</b> · {bl.minutes} min</span>
                          <span className="muted small">{bl.tips}</span>
                        </button>
                      ) : (
                        <div className="row static">
                          <span><b>{bl.title}</b> · {bl.minutes} min</span>
                          <span className="muted small">{bl.tips}</span>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
            </details>
          ))}
        </Sheet>
      )}
      {sheet === 'learn' && (
        <Sheet title="Fundamentos" onClose={() => setSheet(null)}>
          <p className="muted small">Lo esencial para leer un partido y entender cada jugada de la app. Toca un tema y ábrelo en la pizarra.</p>
          {LESSONS.map((l) => (
            <details key={l.id} className="session">
              <summary><b>{l.title}</b><span className="muted small">{l.summary}</span></summary>
              <ul className="tips">
                {l.points.map((pt) => <li key={pt}><span>{pt}</span></li>)}
              </ul>
              {l.templates && (
                <div className="row-actions lesson-links">
                  {l.templates.map((id) => TEMPLATES.find((t) => t.id === id)).filter((t) => t !== undefined).map((t) => (
                    <button key={t.id} onClick={() => {
                      load(t.build())
                      setSheet(null)
                      if (l.zones && !zones) toggleZones()
                      if (t.animated) setAutoplay(true)
                    }}>{t.animated ? '▶ ' : ''}{t.name}</button>
                  ))}
                </div>
              )}
            </details>
          ))}
          <details className="session">
            <summary><b>Diccionario</b><span className="muted small">Las palabras que más se oyen en análisis y entrenamientos.</span></summary>
            <dl className="glossary">
              {GLOSSARY.map(([term, def]) => <div key={term}><dt>{term}</dt><dd>{def}</dd></div>)}
            </dl>
          </details>
        </Sheet>
      )}
      {sheet === 'look' && <LookSheet look={look} setLook={setLook} onClose={() => setSheet(null)} />}
      {sheet === 'tips' && (
        <Sheet title="Consejos" onClose={() => setSheet(null)}>
          <p className="muted small">Ideas prácticas de táctica, entrenamiento y gestión del grupo, inspiradas en entrenadores de referencia.</p>
          {TIPS.map((g) => (
            <details key={g.id} className="session">
              <summary><b>{g.name}</b><span className="muted small">{g.tips.length} consejos</span></summary>
              <ul className="tips">
                {g.tips.map((t) => (
                  <li key={t.title}>
                    <b>{t.title}</b>
                    <span>{t.text}</span>
                    {t.source && <span className="muted small">{t.source}</span>}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </Sheet>
      )}
      {sheet === 'export' && (
        <ExportSheet
          hasFrames={!!frames}
          brand={brand}
          setBrand={setBrand}
          brandMode={brandMode}
          setBrandMode={setBrandMode}
          profile={profile}
          onIdentity={() => setSheet('identity')}
          end={endCard}
          setEnd={setEnd}
          phrase={oncePhrase ?? endCard.phrase}
          setPhrase={setOncePhrase}
          onPreview={() => { setSheet(null); setPreview(true) }}
          onClose={() => setSheet(null)}
          onImage={() => runExport([{ name: 'pizarra', board }], true)}
          onVideo={doVideo}
          onMany={runExport}
          vopts={vopts}
          setVopts={setVopts}
        />
      )}
      {sheet === 'identity' && (
        <IdentitySheet
          store={idStore}
          setStore={setIdStore}
          brandMode={brandMode}
          setBrandMode={setBrandMode}
          brand={brand}
          setBrand={setBrand}
          end={endCard}
          setEnd={setEnd}
          onError={setToast}
          onClose={() => setSheet(null)}
        />
      )}
      {preview && frames && (
        <Preview
          board={board}
          opts={exportOpts}
          vopts={vopts}
          setVopts={setVopts}
          end={endCard}
          setEnd={setEnd}
          brandMode={brandMode}
          setBrandMode={setBrandMode}
          onClose={() => setPreview(false)}
          onExport={() => { setPreview(false); doVideo() }}
        />
      )}
      {sheet === 'plays' && <PlaysSheet board={board} onOpen={(b) => { load(b); setSheet(null) }} onClose={() => setSheet(null)} onSaved={() => setToast('Jugada guardada')} />}
      {present && (
        <div className="present" ref={presentRef} role="dialog" aria-label="Modo proyector">
          {frames && frames.some((f) => f.note) && (
            <div className="present-note" aria-live="polite">
              {/* Al cambiar de paso el texto nuevo aparece fundido sobre el anterior, sin corte. */}
              <span style={{ opacity: cap.fade }}><b>Paso {cap.k + 1}/{nFrames}</b> {frames[cap.k].note}</span>
              {cap.fade < 1 && <span aria-hidden="true" style={{ opacity: 1 - cap.fade }}><b>Paso {cap.prev + 1}/{nFrames}</b> {frames[cap.prev].note}</span>}
            </div>
          )}
          <svg viewBox={`${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`} className="present-board">
            <Markers />
            <Scene board={board} s={anim ?? cur} zones={zones} brand={mark} ident={ident} look={look} />
          </svg>
          {frames && <button className="present-zone left" onClick={prevStep} aria-label="Paso anterior" />}
          {frames && <button className="present-zone right" onClick={nextStep} aria-label="Paso siguiente" />}
          <div className="present-bar">
            {frames && (
              <>
                <button onClick={prevStep} disabled={cur === 0 && anim === null} aria-label="Paso anterior">‹</button>
                <button className="primary" onClick={play}>{playing ? '❚❚ Pausa' : '▶ Reproducir'}</button>
                <button onClick={nextStep} disabled={cur >= nFrames - 1 && anim === null} aria-label="Paso siguiente">›</button>
              </>
            )}
            <button onClick={closePresent}>Salir</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button onClick={onClose}>Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PlaysSheet({ board, onOpen, onClose, onSaved }: { board: Board; onOpen: (b: Board) => void; onClose: () => void; onSaved: () => void }) {
  const [plays, setPlays] = useState<SavedPlay[]>(listPlays)
  const [name, setName] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const n = name.trim() || `Jugada ${plays.length + 1}`
    savePlay({ id: uid(), name: n, updated: Date.now(), board })
    setPlays(listPlays())
    setName('')
    onSaved()
  }
  return (
    <Sheet title="Mis jugadas" onClose={onClose}>
      <form className="saveform" onSubmit={save}>
        <input id="play-name" placeholder="Nombre, por ejemplo: Córner primer palo" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="primary" type="submit">Guardar la pizarra actual</button>
      </form>
      <p className="muted small">Las jugadas se guardan en este dispositivo, con sus pasos de animación.</p>
      <div className="list">
        {plays.length === 0 && <p className="muted">Todavía no hay jugadas guardadas.</p>}
        {plays.map((p) => (
          <div key={p.id} className="row play">
            <div>
              <b>{p.board.frames && '▶ '}{p.name}</b>
              <span className="muted small">{PITCH[p.board.pitch].name} · {new Date(p.updated).toLocaleDateString('es')}</span>
            </div>
            <button onClick={() => onOpen(p.board)}>Abrir</button>
            {confirm === p.id ? (
              <button className="danger" onClick={() => { deletePlay(p.id); setPlays(listPlays()); setConfirm(null) }}>Confirmar</button>
            ) : (
              <button onClick={() => setConfirm(p.id)}>Eliminar</button>
            )}
          </div>
        ))}
      </div>
    </Sheet>
  )
}

function ToolIcon({ t }: { t: Tool }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {t === 'move' && <><circle cx="12" cy="12" r="5" {...s} /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" {...s} /></>}
      {t === 'pass' && <><path d="M4 18L18 6" {...s} /><path d="M12 6h6v6" {...s} /></>}
      {t === 'run' && <><path d="M4 18L18 6" {...s} strokeDasharray="3 3" /><path d="M12 6h6v6" {...s} /></>}
      {t === 'dribble' && <><path d="M3 14c2-4 4 4 6 0s4 4 6 0 3 2 4 0" {...s} /><path d="M17 9l3 4-4 2" {...s} /></>}
      {t === 'zone' && <rect x="4" y="6" width="16" height="12" rx="1" {...s} strokeDasharray="3 2" />}
      {t === 'focus' && <><circle cx="12" cy="12" r="7" {...s} /><circle cx="12" cy="12" r="2.5" {...s} /></>}
      {t === 'free' && <path d="M4 17c3-6 6 2 9-3s4-6 7-5" {...s} />}
      {t === 'erase' && <><path d="M8 20h12" {...s} /><path d="M4 15l9-9 6 6-7 7H8z" {...s} /></>}
    </svg>
  )
}

type VideoOpts = { big: boolean; outro: boolean; full?: boolean }

function ExportSheet({ hasFrames, brand, setBrand, brandMode, setBrandMode, profile, onIdentity, end, setEnd, phrase, setPhrase, onPreview, onClose, onImage, onVideo, onMany, vopts, setVopts }: {
  vopts: VideoOpts
  setVopts: (p: Partial<VideoOpts>) => void
  hasFrames: boolean
  brand: string
  setBrand: (v: string) => void
  brandMode: BrandMode
  setBrandMode: (m: BrandMode) => void
  profile: Profile | null
  onIdentity: () => void
  end: EndCard
  setEnd: (p: Partial<EndCard>) => void
  phrase: string
  setPhrase: (v: string) => void
  onPreview: () => void
  onClose: () => void
  onImage: () => void
  onVideo: () => void
  onMany: (items: { name: string; board: Board }[]) => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const plays = listPlays()
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const many = () => onMany(picked.map((id) => {
    const pl = plays.find((p) => p.id === id)
    if (pl) return { name: pl.name, board: pl.board }
    const t = TEMPLATES.find((x) => x.id === id)!
    return { name: t.name, board: t.build() }
  }))
  const Item = ({ id, label, anim }: { id: string; label: string; anim: boolean }) => (
    <label className="pick">
      <input type="checkbox" checked={picked.includes(id)} onChange={() => toggle(id)} />
      <span>{anim && <span className="anim-badge">▶</span>}{label}</span>
    </label>
  )
  return (
    <Sheet title="Exportar" onClose={onClose}>
      <section>
        <h3>Esta pizarra</h3>
        <div className="row-actions">
          <button onClick={onImage}>Imagen PNG</button>
          <button onClick={onVideo} disabled={!hasFrames}>Vídeo MP4</button>
          <button onClick={onPreview} disabled={!hasFrames}>Vista previa</button>
        </div>
        {!hasFrames && <p className="muted small">El vídeo y la vista previa necesitan una jugada con pasos (pulsa + Paso).</p>}
      </section>
      <section>
        <h3>Mi identidad</h3>
        <BrandPicker brandMode={brandMode} setBrandMode={setBrandMode} brand={brand} setBrand={setBrand} profile={profile} />
        <button className="wide" onClick={onIdentity}>{profile ? `Editar mi identidad · ${profileLabel(profile)}` : 'Crear mi identidad'}</button>
      </section>
      <section>
        <h3>Opciones del vídeo</h3>
        <label className="pick">
          <input type="checkbox" checked={vopts.big} onChange={(e) => setVopts({ big: e.target.checked })} />
          <span>Letra grande <span className="muted small">para verlo en el móvil, WhatsApp o redes</span></span>
        </label>
        <label className="pick">
          <input type="checkbox" checked={!!vopts.full} onChange={(e) => setVopts({ full: e.target.checked })} />
          <span>Campo a todo el ancho <span className="muted small">el vídeo sale más alto que una pantalla panorámica</span></span>
        </label>
        <EndEditor end={end} setEnd={setEnd} phrase={phrase} setPhrase={setPhrase} perVideo profile={profile} />
        <label className="pick">
          <input type="checkbox" checked={vopts.outro} onChange={(e) => setVopts({ outro: e.target.checked })} />
          <span>Cierre con el logo de TacticalPro <span className="muted small">Aprende · Planifica · Entrena</span></span>
        </label>
      </section>
      <section>
        <h3>Varias a la vez</h3>
        <p className="muted small">Marca las que quieras. Las animadas salen en vídeo y las demás en imagen.</p>
        {plays.length > 0 && (
          <details className="session" open>
            <summary><b>Mis jugadas</b><span className="muted small">{plays.length}</span></summary>
            <div className="picklist">{plays.map((p) => <Item key={p.id} id={p.id} label={p.name} anim={!!p.board.frames} />)}</div>
          </details>
        )}
        {GROUPS.map((g) => {
          const list = TEMPLATES.filter((t) => t.group === g.id)
          return (
            <details key={g.id} className="session">
              <summary><b>{g.name}</b><span className="muted small">{list.filter((t) => picked.includes(t.id)).length || ''} {list.length}</span></summary>
              <div className="picklist">{list.map((t) => <Item key={t.id} id={t.id} label={t.name} anim={!!t.animated} />)}</div>
            </details>
          )
        })}
        <button className="primary wide" disabled={!picked.length} onClick={many}>
          {picked.length ? `Exportar ${picked.length} seleccionada${picked.length > 1 ? 's' : ''}` : 'Elige al menos una'}
        </button>
      </section>
      <p className="muted small">Versión {__BUILD__}</p>
    </Sheet>
  )
}

// Qué marca se ve abajo a la derecha. Las opciones de siempre (logo, texto, sin marca) siguen igual.
function BrandPicker({ brandMode, setBrandMode, brand, setBrand, profile }: {
  brandMode: BrandMode
  setBrandMode: (m: BrandMode) => void
  brand: string
  setBrand: (v: string) => void
  profile: Profile | null
}) {
  const m = isIdentityMode(brandMode) ? markFor(brandMode, profile) : null
  return (
    <>
      <label className="pace field-full">
        <span>Se ve</span>
        <select value={brandMode} onChange={(e) => setBrandMode(e.target.value as BrandMode)} aria-label="Qué marca se ve">
          {BRAND_MODES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      {brandMode === 'text' && (
        <label className="field brand">
          <input id="brand" value={brand} maxLength={30} placeholder="Escribe tu marca" onChange={(e) => setBrand(e.target.value)} />
        </label>
      )}
      {isIdentityMode(brandMode) && (
        m ? (
          <svg className="mark-preview" viewBox="0 0 44 8" role="img" aria-label="Así se verá abajo a la derecha">
            <rect x={0} y={0} width={44} height={8} fill="var(--pitch-out)" />
            <rect x={-1} y={-1} width={42} height={3.2} fill="var(--pitch)" stroke="rgba(255,255,255,.85)" strokeWidth={0.12} />
            <IdentityMark m={m} right={41.5} top={2.6} h={4.4} maxW={34} />
          </svg>
        ) : <p className="muted small">{profile ? 'Rellena los datos de tu perfil para que aparezca.' : 'Todavía no tienes perfil. Pulsa «Crear mi identidad».'}</p>
      )}
      <p className="muted small">Sale pequeña y discreta abajo a la derecha, fuera del campo: en la pizarra, el proyector, las imágenes y los vídeos.</p>
    </>
  )
}

// Mensaje final del vídeo. En Exportar la frase se puede cambiar solo para ese vídeo; en Mi identidad se elige la de siempre.
function EndEditor({ end, setEnd, phrase, setPhrase, perVideo = false, profile }: {
  end: EndCard
  setEnd: (p: Partial<EndCard>) => void
  phrase: string
  setPhrase: (v: string) => void
  perVideo?: boolean
  profile: Profile | null
}) {
  const p = phrase.trim()
  const isFav = end.favorites.includes(p)
  return (
    <div className="endcard">
      <label className="pick">
        <input type="checkbox" checked={end.on} onChange={(e) => setEnd({ on: e.target.checked })} />
        <span>Mensaje final <span className="muted small">pantalla con tu frase, tu escudo y tu nombre al terminar el vídeo</span></span>
      </label>
      {end.on && (
        <div className="endcard-body">
          <label className="stack">
            <span className="muted small">{perVideo ? 'Frase de este vídeo' : 'Tu frase de siempre'}</span>
            <textarea rows={2} maxLength={140} value={phrase} placeholder="Escribe tu frase o elige una guardada" onChange={(e) => setPhrase(e.target.value)} />
          </label>
          {perVideo && phrase !== end.phrase && <p className="muted small">Este cambio solo vale para el próximo vídeo. Tu frase de siempre no cambia.</p>}
          {!p && <p className="muted small">Sin frase no se añade la pantalla final.</p>}
          <div className="favs">
            {end.favorites.map((f) => (
              <span key={f} className={`fav${f === p ? ' on' : ''}`}>
                <button onClick={() => setPhrase(f)}>{f}</button>
                {!perVideo && <button className="x" aria-label={`Quitar «${f}» de favoritas`} onClick={() => setEnd({ favorites: end.favorites.filter((x) => x !== f) })}>✕</button>}
              </span>
            ))}
          </div>
          {p && !isFav && <button onClick={() => setEnd({ favorites: [...end.favorites, p] })}>★ Guardar en favoritas</button>}
          <div className="pace">
            <span>Duración</span>
            <div className="seg" role="group" aria-label="Duración del mensaje">
              {[3, 4, 5].map((n) => <button key={n} className={end.seconds === n ? 'on' : ''} onClick={() => setEnd({ seconds: n })}>{n} s</button>)}
            </div>
          </div>
          <div className="checks">
            {([['crest', 'Escudo'], ['club', 'Equipo'], ['coach', 'Mi nombre'], ['slogan', 'Eslogan']] as const).map(([k, label]) => (
              <label key={k} className="pick">
                <input type="checkbox" checked={end[k]} onChange={(e) => setEnd({ [k]: e.target.checked })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {!profile && <p className="muted small">Crea tu perfil en Mi identidad para añadir escudo, equipo y nombre.</p>}
        </div>
      )}
    </div>
  )
}

function IdentitySheet({ store, setStore, brandMode, setBrandMode, brand, setBrand, end, setEnd, onError, onClose }: {
  store: IdentityStore
  setStore: (f: (s: IdentityStore) => IdentityStore) => void
  brandMode: BrandMode
  setBrandMode: (m: BrandMode) => void
  brand: string
  setBrand: (v: string) => void
  end: EndCard
  setEnd: (p: Partial<EndCard>) => void
  onError: (msg: string) => void
  onClose: () => void
}) {
  const p = store.profiles.find((x) => x.id === store.active) ?? null
  const [confirm, setConfirm] = useState(false)
  const [otherRole, setOtherRole] = useState(() => !!p && !ROLES.includes(p.role))
  const file = useRef<HTMLInputElement>(null)
  const update = (patch: Partial<Profile>) => setStore((s) => ({ ...s, profiles: s.profiles.map((x) => (x.id === s.active ? { ...x, ...patch } : x)) }))
  const pick = (id: string) => {
    setStore((s) => ({ ...s, active: id }))
    const q = store.profiles.find((x) => x.id === id)
    setOtherRole(!!q && !ROLES.includes(q.role))
    setConfirm(false)
  }
  const add = () => {
    const q = newProfile()
    setStore((s) => ({ profiles: [...s.profiles, q], active: q.id }))
    setOtherRole(false)
    setConfirm(false)
    if (!isIdentityMode(brandMode)) setBrandMode('full')
  }
  const remove = () => {
    setStore((s) => {
      const profiles = s.profiles.filter((x) => x.id !== s.active)
      return { profiles, active: profiles[0]?.id ?? null }
    })
    setConfirm(false)
  }
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try { update(await readCrest(f)) } catch (err) { onError(err instanceof Error ? err.message : 'No se pudo leer la imagen') }
  }
  return (
    <Sheet title="Mi identidad" onClose={onClose}>
      <p className="muted small">Tu nombre, tu equipo y tu escudo en tus pizarras, imágenes y vídeos. Se guarda solo en este dispositivo: sin cuenta y sin internet.</p>
      <section>
        <h3>Perfiles</h3>
        <div className="chips-row">
          {store.profiles.map((x) => (
            <button key={x.id} className={x.id === store.active ? 'on' : ''} onClick={() => pick(x.id)}>{profileLabel(x)}</button>
          ))}
          <button className="primary" onClick={add}>+ Nuevo perfil</button>
        </div>
      </section>
      {p && (
        <section className="idform">
          <label className="stack">
            <span className="muted small">Nombre del entrenador</span>
            <input id="id-coach" value={p.coach} maxLength={60} placeholder="Ej.: Jesús Cortinas" onChange={(e) => update({ coach: e.target.value })} />
          </label>
          <label className="stack">
            <span className="muted small">Cargo</span>
            <select id="id-role" value={otherRole ? 'otro' : p.role} onChange={(e) => {
              if (e.target.value === 'otro') { setOtherRole(true); update({ role: '' }) } else { setOtherRole(false); update({ role: e.target.value }) }
            }}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              <option value="otro">Otro…</option>
            </select>
          </label>
          {otherRole && <input id="id-role-other" value={p.role} maxLength={40} placeholder="Escribe tu cargo" onChange={(e) => update({ role: e.target.value })} />}
          <label className="stack">
            <span className="muted small">Club, equipo o escuela</span>
            <input id="id-club" value={p.club} maxLength={60} placeholder="Ej.: Semillas Tuluá FC" onChange={(e) => update({ club: e.target.value })} />
          </label>
          <div className="stack">
            <span className="muted small">Escudo (PNG, JPG o WebP)</span>
            <div className="crest-row">
              {p.crest ? <img className="crest" src={p.crest} alt="Escudo" /> : <span className="crest empty">Sin escudo</span>}
              <button onClick={() => file.current?.click()}>{p.crest ? 'Cambiar' : 'Subir escudo'}</button>
              {p.crest && <button onClick={() => update({ crest: undefined, crestRatio: undefined })}>Quitar</button>}
              <input ref={file} id="id-crest" type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
            </div>
            <span className="muted small">Mejor en PNG con fondo transparente. Se respeta la forma y la transparencia.</span>
          </div>
          <label className="stack">
            <span className="muted small">Eslogan (opcional)</span>
            <input id="id-slogan" value={p.slogan} maxLength={80} placeholder="Ej.: Formamos personas, formamos futbolistas" onChange={(e) => update({ slogan: e.target.value })} />
          </label>
          {confirm ? (
            <div className="row-actions">
              <button className="danger" onClick={remove}>Sí, eliminar «{profileLabel(p)}»</button>
              <button onClick={() => setConfirm(false)}>Cancelar</button>
            </div>
          ) : <button onClick={() => setConfirm(true)}>Eliminar este perfil</button>}
        </section>
      )}
      {!p && <p className="muted">Crea tu primer perfil con «+ Nuevo perfil». Ningún dato es obligatorio.</p>}
      <section>
        <h3>Qué se ve</h3>
        <BrandPicker brandMode={brandMode} setBrandMode={setBrandMode} brand={brand} setBrand={setBrand} profile={p} />
      </section>
      <section>
        <h3>Mensaje final del vídeo</h3>
        <EndEditor end={end} setEnd={setEnd} phrase={end.phrase} setPhrase={(v) => setEnd({ phrase: v })} profile={p} />
      </section>
      <p className="muted small">La marca de TacticalPro y la tuya van por separado: el logo de TacticalPro solo sale si activas su cierre al exportar.</p>
    </Sheet>
  )
}

// Vista previa: el mismo dibujo que el vídeo, en tiempo real. Si cambias una opción, se actualiza sin volver al principio.
function Preview({ board, opts, vopts, setVopts, end, setEnd, brandMode, setBrandMode, onClose, onExport }: {
  board: Board
  opts: ExportOpts
  vopts: VideoOpts
  setVopts: (p: Partial<VideoOpts>) => void
  end: EndCard
  setEnd: (p: Partial<EndCard>) => void
  brandMode: BrandMode
  setBrandMode: (m: BrandMode) => void
  onClose: () => void
  onExport: () => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const clock = useRef({ t: 0, at: performance.now() })
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const [info, setInfo] = useState({ t: 0, total: 0 })
  const rend = useRef<Renderer | null>(null)
  const now = () => (pausedRef.current ? clock.current.t : clock.current.t + (performance.now() - clock.current.at) / 1000)
  const seek = (t: number) => { clock.current = { t, at: performance.now() } }
  useEffect(() => {
    let alive = true
    let busy = false
    let id = 0
    ;(async () => {
      const ex = await import('./exportVideo')
      const r = await ex.videoRenderer(board, opts, canvas.current!)
      if (!alive) return
      rend.current = r
      const tick = async () => {
        if (!alive) return
        if (!busy) {
          busy = true
          let t = now()
          // Al terminar vuelve a empezar tras un segundo.
          if (t > r.seconds + 1) { seek(0); t = 0 }
          await r.draw(Math.min(t, r.seconds - 0.001))
          setInfo({ t: Math.min(t, r.seconds), total: r.seconds })
          busy = false
        }
        id = requestAnimationFrame(tick)
      }
      tick()
    })()
    return () => { alive = false; cancelAnimationFrame(id) }
  }, [board, opts])
  const toggle = () => {
    const t = now()
    pausedRef.current = !pausedRef.current
    seek(t)
    setPaused(pausedRef.current)
  }
  const fmt = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`
  return (
    <div className="preview" role="dialog" aria-label="Vista previa del vídeo">
      <div className="preview-frame"><canvas ref={canvas} width={1280} height={720} /></div>
      <div className="preview-bar">
        <button className="primary" onClick={toggle}>{paused ? '▶ Seguir' : '❚❚ Pausa'}</button>
        <button onClick={() => seek(0)}>⟲ Inicio</button>
        <button onClick={() => seek(Math.max(0, (rend.current?.animSeconds ?? 0) - 1.5))} disabled={!end.on && !vopts.outro}>Ver el final</button>
        <span className="muted small time">{fmt(info.t)} / {fmt(info.total)}</span>
      </div>
      <div className="preview-opts">
        <label className="pick"><input type="checkbox" checked={vopts.big} onChange={(e) => setVopts({ big: e.target.checked })} /><span>Letra grande</span></label>
        <label className="pick"><input type="checkbox" checked={!!vopts.full} onChange={(e) => setVopts({ full: e.target.checked })} /><span>Campo a todo el ancho</span></label>
        <label className="pick"><input type="checkbox" checked={end.on} onChange={(e) => setEnd({ on: e.target.checked })} /><span>Mensaje final</span></label>
        <label className="pick"><input type="checkbox" checked={vopts.outro} onChange={(e) => setVopts({ outro: e.target.checked })} /><span>Cierre TacticalPro</span></label>
        <label className="pace">
          <span>Marca</span>
          <select value={brandMode} onChange={(e) => setBrandMode(e.target.value as BrandMode)} aria-label="Qué marca se ve">
            {BRAND_MODES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      </div>
      <div className="preview-bar">
        <button onClick={onClose}>Volver</button>
        <button className="primary" onClick={onExport}>Exportar vídeo MP4</button>
      </div>
    </div>
  )
}

function LookSheet({ look, setLook, onClose }: { look: Look; setLook: (p: Partial<Look>) => void; onClose: () => void }) {
  const preview = (shape: TokenShapeKind) => (
    <svg viewBox="-6 -3.2 12 7.4" width="120" height="74" aria-hidden="true">
      <Markers />
      <rect x="-10" y="-10" width="20" height="20" fill="var(--pitch)" />
      <TokenShape t={{ id: 'a', kind: 'player', team: 'home', label: '10', name: 'Martín', x: -2.6, y: -0.4 }} r={1.5} selected={false} upright={false} look={{ ...look, shape }} />
      <TokenShape t={{ id: 'b', kind: 'player', team: 'away', label: '9', name: 'Rivas', x: 2.6, y: -0.4 }} r={1.5} selected={false} upright={false} look={{ ...look, shape }} />
    </svg>
  )
  const swatches = (team: 'home' | 'away') => (
    <div className="colors" role="group" aria-label={team === 'home' ? 'Color del local' : 'Color del rival'}>
      {TEAM_COLORS.map((c) => (
        <button key={c} aria-label={`Color ${c}`} className={look[team] === c ? 'on' : ''} style={{ background: c }} onClick={() => setLook({ [team]: c })} />
      ))}
    </div>
  )
  return (
    <Sheet title="Fichas" onClose={onClose}>
      <section>
        <h3>Forma</h3>
        <div className="shapes">
          {(['pro', 'disc', 'shirt'] as TokenShapeKind[]).map((sh) => (
            <button key={sh} className={look.shape === sh ? 'on' : ''} onClick={() => setLook({ shape: sh })}>
              {preview(sh)}
              <span>{sh === 'pro' ? 'Ficha pro' : sh === 'disc' ? 'Clásica' : 'Camiseta'}</span>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3>Mostrar</h3>
        <div className="seg" role="group" aria-label="Qué mostrar">
          {(['number', 'name', 'both'] as TokenText[]).map((tx) => (
            <button key={tx} className={look.text === tx ? 'on' : ''} onClick={() => setLook({ text: tx })}>
              {tx === 'number' ? 'Número' : tx === 'name' ? 'Nombre' : 'Número y nombre'}
            </button>
          ))}
        </div>
        <p className="muted small">Para poner el nombre, toca un jugador en la pizarra y escríbelo en “Nombre”, junto al dorsal.</p>
      </section>
      <section>
        <h3>Color del local</h3>
        {swatches('home')}
        <h3>Color del rival</h3>
        {swatches('away')}
      </section>
      <p className="muted small">Se aplica a todas las pizarras, imágenes y vídeos.</p>
    </Sheet>
  )
}
