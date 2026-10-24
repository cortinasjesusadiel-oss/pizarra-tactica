import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MOVES_BALL, MOVES_PLAYER, STRAIGHT,
  DEFAULT_COLOR, PITCH, ballAt, item, player, posAt, uid,
  type Board, type TokenKind, type DrawTool, type Drawing, type PitchKind, type Pt, type Token, type Tool,
  LABEL_BG_COLORS, LABEL_DEFAULT_BG, lobBend, LABEL_SIZES, LABEL_TEXT_COLORS,
} from './model'
import { Markers } from './Shapes'
import { useArt } from './material'
import { Scene } from './Scene'
import { caption, paceAt, shownStep } from './motion'
import { ballToFeet, carrier, movesFromArrows, settleBall } from './steps'
import { TEMPLATES, emptyBoard } from './templates'
import type { Template } from './anim'
import { loadLast } from './storage'
import { isTyping } from './keys'
import { numberPlayers as numberOnly } from './numbering'
import { endFor, isIdentityMode, markFor } from './identity'
import type { ExportOpts } from './exportVideo'
import { t, tr } from './i18n'
import { useHistorial } from './nucleo/historial'
import { SelBar, StepBar, ToolBar, TopBar, type SheetId } from './pantalla/barras'
import { ExportSheet, HelpSheet, IdentitySheet, LearnSheet, LookSheet, MaterialSheet, PlaysSheet, Preview, SessionsSheet, TemplatesSheet, TipsSheet } from './pantalla/hojas'
import { useAutoguardado } from './nucleo/guardado'
import { ayudaVista, guardarEstiloLetrero, leerEstiloLetrero, primeraVez, useOrientacion, usePreferencias } from './nucleo/preferencias'

const PAD = 3

type Action =
  | { kind: 'move'; id: string; dx: number; dy: number; ball?: { id: string; ox: number; oy: number } }
  | { kind: 'draw'; drawing: Drawing; raw?: Pt[] }
  | { kind: 'erase' }
  | { kind: 'moveText'; id: string; dx: number; dy: number; edit?: Drawing }
  | { kind: 'rotate'; id: string; c: Pt; d0: number; size0: number }
  | { kind: 'none' }

// Letrero que se está escribiendo o editando, con su estilo.
type LabelEdit = { id: string; p: Pt; text: string; color: string; bg: string; fs: number }
// Un letrero nuevo usa el último estilo elegido.
function newLabel(p: Pt): LabelEdit {
  const st = leerEstiloLetrero()
  return { id: '', p, text: '', color: st.color ?? '#ffffff', bg: st.bg ?? LABEL_DEFAULT_BG, fs: st.fs ?? 2.1 }
}
const editLabel = (d: Drawing): LabelEdit => ({ id: d.id, p: d.points[0], text: d.text ?? '', color: d.color, bg: d.bg ?? LABEL_DEFAULT_BG, fs: d.fs ?? 2.1 })

const ease = (k: number) => k * k * (3 - 2 * k)
// Móvil de lado: menú a la izquierda, herramientas a la derecha y el campo con toda la altura (igual que en index.css).
const SIDE_QUERY = '(max-height: 500px) and (orientation: landscape)'
const PORTRAIT_PHONE_QUERY = '(max-width: 599px) and (orientation: portrait)'
function useMedia(q: string) {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && matchMedia(q).matches)
  useEffect(() => {
    if (!window.matchMedia) return
    const m = matchMedia(q)
    const upd = () => setOn(m.matches)
    upd()
    m.addEventListener('change', upd)
    return () => m.removeEventListener('change', upd)
  }, [q])
  return on
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Las notas de los pasos que vienen de plantillas se pasan al idioma actual al abrir la jugada; las escritas a mano no cambian.
const inLang = (b: Board): Board => (b.frames ? { ...b, frames: b.frames.map((f) => ({ ...f, note: tr(f.note) })) } : b)

// Al abrir una plantilla o sesión: todos los jugadores con número y el balón a los pies, sin tapar el dorsal.
const numberPlayers = (b: Board) => settleBall(numberOnly(b))

export default function App() {
  // La pizarra abierta y su historial para deshacer y rehacer.
  const historial = useHistorial(() => { const l = loadLast(); return l ? inLang(l) : numberPlayers(TEMPLATES.find((t) => t.animated)!.build()) })
  const { board, setBoard, commit, apuntar, olvidar, refrescar } = historial

  const art = useArt()
  const [tool, setTool] = useState<Tool>('move')

  // Barras que se deslizan de lado: se difumina el borde por el que queda más contenido, para que se vea que sigue.
  useEffect(() => {
    const upd = () => document.querySelectorAll<HTMLElement>('.top, .tools, .selbar, .animbar').forEach((el) => {
      // Con el móvil de lado las barras van en columnas y se deslizan hacia abajo.
      // La columna de herramientas no se difumina: sus menús salen por fuera de la columna y el difuminado los taparía.
      const f = el.scrollHeight > el.clientHeight + 2 && !el.classList.contains('tools')
        ? (el.scrollTop > 2 ? 't' : '') + (el.scrollTop + el.clientHeight < el.scrollHeight - 2 ? 'b' : '')
        : (el.scrollLeft > 2 ? 'l' : '') + (el.scrollLeft + el.clientWidth < el.scrollWidth - 2 ? 'r' : '')
      if (el.dataset.fade !== f) el.dataset.fade = f
    })
    upd()
    document.addEventListener('scroll', upd, true)
    window.addEventListener('resize', upd)
    const id = setInterval(upd, 800)
    return () => { document.removeEventListener('scroll', upd, true); window.removeEventListener('resize', upd); clearInterval(id) }
  }, [])
  // Editor grande de la explicación del paso (en el móvil la casilla de la barra es pequeña).
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteMini, setNoteMini] = useState(false)
  const [penTool, setPenTool] = useState<DrawTool>('pass')
  const [color, setColor] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [live, setLive] = useState<Drawing | null>(null)
  // Letrero que se está escribiendo o editando (id vacío = nuevo).
  const [label, setLabel] = useState<LabelEdit | null>(null)
  const [penSeen, setPenSeen] = useState(false)
  const [sheet, setSheet] = useState<SheetId | null>(null)
  const [showHint, setShowHint] = useState(primeraVez)
  const closeHint = () => { setShowHint(false); ayudaVista() }
  const [toast, setToast] = useState<string | null>(null)
  // Preferencias guardadas en el dispositivo (zonas, ritmo, fichas, marca, Mi identidad, vídeo).
  const prefs = usePreferencias(() => setToast(t('No se pudo guardar en el dispositivo: prueba con un escudo más ligero')))
  const { zones, toggleZones, pace, setPace, look, setLook, brand, setBrand, brandMode, setBrandMode, idStore, setIdStore, endCard, setEnd, vopts, setVopts } = prefs

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
  const action = useRef<Action>({ kind: 'none' })
  const pointer = useRef<number | null>(null)
  const penDown = useRef(false)
  const startSnap = useRef<string>('')

  const frames = board.frames
  const nFrames = frames?.length ?? 0
  const cur = Math.min(step, Math.max(0, nFrames - 1))
  const { w: W, h: H } = PITCH[board.pitch]
  // Orientación del campo: horizontal por defecto (el equipo ataca hacia la derecha), también el medio campo.
  // Se puede girar a vertical, sobre todo para el móvil en vertical. Se guarda en el dispositivo.
  // Si nunca se eligió, un móvil sujeto en vertical muestra el campo en vertical (se ve más grande).
  // Con el móvil de lado el campo va siempre en horizontal, que es como más ocupa; al volver a ponerlo
  // de pie vuelve la orientación elegida. Girar el móvil no cambia nada más: la jugada, el paso y la ficha elegida siguen igual.
  const [orientPref, setOrientPref] = useOrientacion()
  const side = useMedia(SIDE_QUERY)
  const portraitPhone = useMedia(PORTRAIT_PHONE_QUERY)
  const vertical = !side && (orientPref ?? portraitPhone)
  const toggleVertical = () => {
    setOrientPref(!vertical)
  }

  // Autoguardado: si el dispositivo no deja guardar, se avisa con una franja fija (sin repetir avisos en cada movimiento).
  // La pizarra sigue abierta en memoria y se ofrece hacer una copia.
  const saveFail = useAutoguardado(board)

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

  // Cargar una pizarra nueva (plantilla, jugada guardada o campo vacío).
  const load = useCallback((b: Board) => {
    stopAnim()
    commit(inLang(b))
    setStep(0)
    setSelected(null)
  }, [commit, stopAnim])

  const { deshacer, rehacer } = historial
  const undo = useCallback(() => {
    if (!deshacer()) return
    stopAnim()
    setSelected(null)
    refrescar()
  }, [deshacer, stopAnim, refrescar])
  const redo = useCallback(() => {
    if (!rehacer()) return
    stopAnim()
    refrescar()
  }, [rehacer, stopAnim, refrescar])

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

  const mark = brandMode === 'logo' ? 'logo' : brandMode === 'text' ? brand.trim() || undefined : undefined

  const profile = idStore.profiles.find((p) => p.id === idStore.active) ?? null
  const ident = useMemo(() => (isIdentityMode(brandMode) ? markFor(brandMode, profile) : null), [brandMode, profile])
  // La frase se puede cambiar solo para el próximo vídeo sin tocar la guardada.
  const [oncePhrase, setOncePhrase] = useState<string | null>(null)
  const endView = useMemo(() => endFor(endCard, profile, oncePhrase ?? endCard.phrase), [endCard, profile, oncePhrase])
  const [preview, setPreview] = useState(false)

  // Exportar: los vídeos se crean fotograma a fotograma; al terminar se ofrece compartir (WhatsApp, etc.) o guardar.
  const [ready, setReady] = useState<File[] | null>(null)
  const [progressLabel, setProgressLabel] = useState('')
  const exportOpts: ExportOpts = useMemo(() => ({ zones, brand: mark, look, pace, ...vopts, ident, end: endView, vertical }), [zones, mark, look, pace, vopts, ident, endView, vertical])
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
        if (res === 'unsupported') { setToast(t('Este navegador no puede crear vídeo. Prueba con Chrome actualizado.')); return }
        files = [res.file]
        setOncePhrase(null)
      } else {
        let idx = 0
        files = await ex.exportMany(items, {
          ...opts,
          onItem: (i) => { idx = i; setProgressLabel(t('{i} de {n}: ', { i: i + 1, n: items.length })) },
          onProgress: (k) => setVideo((idx + k) / items.length),
        })
      }
      setReady(files)
    } catch (e) {
      // El motivo se enseña para poder arreglarlo si vuelve a pasar.
      console.error(e)
      setToast(t('No se pudo exportar: {e}', { e: e instanceof Error ? e.message : String(e) }).slice(0, 160))
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
    try { await saveFiles(ready); setToast(ready.length > 1 ? t('Archivos guardados') : t('Archivo guardado')); setReady(null) } catch { setToast(t('No se pudo guardar')) }
  }
  const saveReady = async () => {
    if (!ready) return
    const { saveFiles } = await import('./exportVideo')
    try { await saveFiles(ready); setToast(ready.length > 1 ? t('Archivos guardados') : t('Archivo guardado')); setReady(null) } catch { setToast(t('No se pudo guardar')) }
  }

  // Paso nuevo: cada jugador va solo al final de su flecha (carrera o conducción) y el balón al final del pase.
  // Las flechas dibujadas antes de tener pasos pasan a ser las del primer paso.
  const addStep = () => {
    stopAnim()
    const b = board
    const isArrow = (d: Drawing) => MOVES_PLAYER.includes(d.type) || MOVES_BALL.includes(d.type)
    const first = b.frames ? null : b.drawings.filter(isArrow)
    const f = b.frames ?? [{ pos: {}, drawings: first!, note: '' }]
    const pos = movesFromArrows({ ...b, frames: f }, cur, f[cur].drawings)
    commit({
      ...b,
      drawings: first ? b.drawings.filter((d) => !isArrow(d)) : b.drawings,
      frames: [...f.slice(0, cur + 1), { pos, drawings: [], note: '' }, ...f.slice(cur + 1)],
    })
    setStep(nFrames ? cur + 1 : 1)
    setToast(Object.keys(pos).length ? t('Paso añadido: cada ficha ya está al final de su flecha') : t('Paso añadido: mueve las fichas o dibuja flechas y pulsa + Paso'))
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
      if (isTyping(e)) return
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
      if (isTyping(e) || document.querySelector('.present')) return
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

  // La goma busca trazos alrededor del punto (más amplio con el dedo), porque las líneas son finas.
  // Las fichas solo se borran tocándolas de lleno, para no llevarse un jugador por error.
  const eraseAt = (cx: number, cy: number, touch = false) => {
    const at = (x: number, y: number, sel: string) => document.elementFromPoint(x, y)?.closest(sel)?.getAttribute(sel.slice(1, -1)) ?? null
    let d: string | null = at(cx, cy, '[data-draw]')
    if (!d) {
      // Trazo más cercano a menos de 16 px (7 con ratón o lápiz), medido sobre sus puntos.
      const ctm = layer.current!.getScreenCTM()!
      const k = Math.hypot(ctm.a, ctm.b)
      const q = new DOMPoint(cx, cy).matrixTransform(ctm.inverse())
      let best = (touch ? 16 : 7) / k
      const segDist = (a: Pt, b: Pt) => {
        const vx = b[0] - a[0], vy = b[1] - a[1], l = vx * vx + vy * vy
        const u = l ? Math.max(0, Math.min(1, ((q.x - a[0]) * vx + (q.y - a[1]) * vy) / l)) : 0
        return Math.hypot(a[0] + u * vx - q.x, a[1] + u * vy - q.y)
      }
      for (const dr of [...board.drawings, ...(board.frames?.[cur]?.drawings ?? [])]) {
        const ps = dr.points
        if (dr.type === 'text') continue
        const pts: Pt[] = dr.type === 'zone' && ps.length === 2 ? [ps[0], [ps[1][0], ps[0][1]], ps[1], [ps[0][0], ps[1][1]], ps[0]] : ps
        for (let i = 0; i < pts.length; i++) {
          const dist = segDist(pts[i], pts[Math.min(i + 1, pts.length - 1)])
          if (dist < best) { best = dist; d = dr.id }
        }
      }
    }
    const t = d ? null : at(cx, cy, '[data-token]')
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
    const p = toBoard(e)
    // Tirador del material seleccionado: girarlo y cambiar su tamaño.
    const rotId = (e.target as Element).closest('[data-rotate]')?.getAttribute('data-rotate')
    const rt = rotId ? board.tokens.find((x) => x.id === rotId) : undefined
    if (rt) {
      const c = posAt(board, rt, cur)
      pointer.current = e.pointerId
      try { svg.current?.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
      apuntar(board)
      startSnap.current = JSON.stringify(board)
      action.current = { kind: 'rotate', id: rt.id, c, d0: Math.max(0.5, Math.hypot(p[0] - c[0], p[1] - c[1])), size0: rt.size ?? 1 }
      return
    }
    let tokenId = (e.target as Element).closest('[data-token]')?.getAttribute('data-token') ?? null
    // Con el dedo, en el móvil las fichas se ven pequeñas: se coge la ficha más cercana a unos 18 px del toque.
    if (!tokenId && e.pointerType === 'touch') {
      const ctm = layer.current!.getScreenCTM()!
      const reach = 18 / Math.hypot(ctm.a, ctm.b)
      let best = reach
      for (const t of board.tokens) {
        const [x, y] = posAt(board, t, cur)
        const d = Math.hypot(x - p[0], y - p[1])
        if (d < best) { best = d; tokenId = t.id }
      }
    }
    // El balón va dibujado a los pies de quien lo lleva y tapa parte de su ficha: si el toque está más cerca
    // del centro del jugador que del centro del balón, se coge al jugador (y el balón va pegado a él).
    // El balón se sigue pudiendo coger tocándolo por su lado de fuera.
    const hit = tokenId ? board.tokens.find((x) => x.id === tokenId) : undefined
    if (hit?.kind === 'ball') {
      const c = carrier(board, cur)
      if (c) {
        const [cx, cy] = posAt(board, c, cur), [bx, by] = posAt(board, hit, cur)
        if (Math.hypot(p[0] - cx, p[1] - cy) < Math.hypot(p[0] - bx, p[1] - by)) tokenId = c.id
      }
    }
    // Letreros: con la herramienta Texto se toca para escribir uno nuevo o para editar uno que ya está.
    const labelId = (e.target as Element).closest('g.label')?.getAttribute('data-draw') ?? null
    const allDrawings = [...board.drawings, ...(board.frames?.[cur]?.drawings ?? [])]
    if (tool === 'text' && !(isPen && (e.buttons & 2 || e.buttons & 32))) {
      const d = labelId ? allDrawings.find((x) => x.id === labelId) : undefined
      if (!d) { setLabel(newLabel(p)); return }
      // Sobre un letrero: arrastrarlo lo recoloca; tocarlo sin moverlo lo abre para editarlo.
      pointer.current = e.pointerId
      try { svg.current?.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
      apuntar(board)
      startSnap.current = JSON.stringify(board)
      action.current = { kind: 'moveText', id: d.id, dx: d.points[0][0] - p[0], dy: d.points[0][1] - p[1], edit: d }
      return
    }
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
    apuntar(board)
    startSnap.current = JSON.stringify(board)

    if (mode === 'move' && !tokenId && labelId) {
      // Arrastrar un letrero para recolocarlo.
      const d = allDrawings.find((x) => x.id === labelId)
      if (d) { action.current = { kind: 'moveText', id: d.id, dx: d.points[0][0] - p[0], dy: d.points[0][1] - p[1] }; return }
    }
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
      eraseAt(e.clientX, e.clientY, e.pointerType === 'touch')
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
      a.drawing = { ...a.drawing, width, points: STRAIGHT.includes(a.drawing.type) || a.drawing.type === 'zone' ? [pts[0], p] : [...pts, p] }
      // Pase aéreo: se guarda el trazo entero para saber si lo curvas a un lado o lo dejas recto.
      if (a.drawing.type === 'lob') { a.raw = [...(a.raw ?? [pts[0]]), p]; a.drawing.bend = lobBend(a.raw) }
      setLive(a.drawing)
    } else if (a.kind === 'erase') {
      eraseAt(e.clientX, e.clientY, e.pointerType === 'touch')
    } else if (a.kind === 'rotate') {
      const [x, y] = toBoard(e)
      const dx = x - a.c[0], dy = y - a.c[1]
      let ang = (Math.atan2(dx, -dy) * 180) / Math.PI
      ang = ((ang % 360) + 360) % 360
      // Giro continuo; solo se queda fijo en los ángulos rectos y a 45° si pasas muy cerca.
      const near45 = Math.round(ang / 45) * 45
      ang = Math.abs(ang - near45) < 2.5 ? near45 % 360 : +ang.toFixed(1)
      const size = +Math.max(0.4, Math.min(2.5, (a.size0 * Math.hypot(dx, dy)) / a.d0)).toFixed(3)
      setBoard((b) => ({ ...b, tokens: b.tokens.map((t) => (t.id === a.id ? { ...t, rot: ang, size } : t)) }))
    } else if (a.kind === 'moveText') {
      const [x, y] = toBoard(e)
      const pt: Pt = [x + a.dx, y + a.dy]
      const mv = (l: Drawing[]) => l.map((d) => (d.id === a.id ? { ...d, points: [pt] } : d))
      setBoard((b) => ({ ...b, drawings: mv(b.drawings), frames: b.frames?.map((f) => ({ ...f, drawings: mv(f.drawings) })) }))
    }
  }

  // Guardar el letrero: nuevo (en el paso actual si hay pasos) o editado; vacío lo quita.
  const saveLabel = (text: string, remove = false) => {
    if (!label) return
    const txt = text.replace(/\r/g, '').trim()
    guardarEstiloLetrero({ color: label.color, bg: label.bg, fs: label.fs })
    if (label.id) {
      const ed = (l: Drawing[]) => (remove || !txt ? l.filter((d) => d.id !== label.id) : l.map((d) => (d.id === label.id ? { ...d, text: txt, color: label.color, bg: label.bg, fs: label.fs } : d)))
      commit((b) => ({ ...b, drawings: ed(b.drawings), frames: b.frames?.map((f) => ({ ...f, drawings: ed(f.drawings) })) }))
    } else if (txt && !remove) {
      const d: Drawing = { id: uid(), type: 'text', color: label.color, bg: label.bg, fs: label.fs, width: 0.5, points: [label.p], text: txt }
      commit((b) => (b.frames
        ? { ...b, frames: b.frames.map((f, i) => (i === cur ? { ...f, drawings: [...f.drawings, d] } : f)) }
        : { ...b, drawings: [...b.drawings, d] }))
    }
    setLabel(null)
  }

  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointer.current) return
    pointer.current = null
    if (e.pointerType === 'pen') penDown.current = false
    const a = action.current
    action.current = { kind: 'none' }
    if (pendingSel.current !== undefined) { setSelected(pendingSel.current); pendingSel.current = undefined }
    // Balón soltado encima de un jugador: se deja a sus pies para que se siga viendo su número.
    const feet = a.kind === 'move' && !a.ball ? ballToFeet(board, cur, a.id) : null
    const now = a.kind === 'move' ? board.tokens.find((t) => t.id === a.id) : undefined
    if (a.kind === 'move' && feet && now && posAt(board, now, cur).some((v, i) => Math.abs(v - feet[i]) > 0.01)) {
      const id = a.id
      setBoard((b) => (b.frames && cur > 0
        ? { ...b, frames: b.frames.map((f, i) => (i === cur ? { ...f, pos: { ...f.pos, [id]: feet } } : f)) }
        : { ...b, tokens: b.tokens.map((t) => (t.id === id ? { ...t, x: feet[0], y: feet[1] } : t)) }))
      refrescar()
      return
    }
    if (a.kind === 'draw') {
      setLive(null)
      const p = a.drawing.points
      const [x0, y0] = p[0], [x1, y1] = p[p.length - 1]
      const ok = a.drawing.type === 'text' ? false : a.drawing.type === 'zone' ? Math.abs(x1 - x0) > 1 && Math.abs(y1 - y0) > 1 : p.length > 1 && Math.hypot(x1 - x0, y1 - y0) > 1
      if (ok) {
        setBoard((b) => (b.frames
          ? { ...b, frames: b.frames.map((f, i) => (i === cur ? { ...f, drawings: [...f.drawings, a.drawing] } : f)) }
          : { ...b, drawings: [...b.drawings, a.drawing] }))
      } else olvidar()
    } else if (JSON.stringify(board) === startSnap.current) {
      olvidar()
      if (a.kind === 'moveText' && a.edit) setLabel(editLabel(a.edit))
    }
    refrescar()
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
    setToast(t('Pizarra vacía. Si no querías borrarla, pulsa ↶'))
  }

  // Abrir una plantilla de la biblioteca: con números, y si es animada se reproduce sola. Algunas lecciones encienden las zonas.
  const openTemplate = (tpl: Template, withZones = false) => {
    load(numberPlayers(tpl.build()))
    setSheet(null)
    if (withZones && !zones) toggleZones()
    if (tpl.animated) setAutoplay(true)
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
      <TopBar board={board} side={side} zones={zones} toggleZones={toggleZones} newBoard={newBoard} setPitch={setPitch} addToken={addToken}
        undo={undo} redo={redo} canUndo={historial.puedeDeshacer} canRedo={historial.puedeRehacer} openPresent={openPresent} setSheet={setSheet} />

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
          // Con el móvil de lado la explicación flota sobre el campo: al tocarla se pliega para ver todo el campo y al tocarla otra vez vuelve.
          <div className={`note${side && noteMini ? ' mini' : ''}`} aria-live="polite" onClick={side ? () => setNoteMini((m) => !m) : undefined}>
            <b>{t('Paso')}{' '}{shown + 1}.</b>{side && noteMini ? ' ▾' : <> {tr(frames[shown].note)}</>}
          </div>
        )}
        {noteOpen && frames && (
          <div className="note-editor" role="dialog" aria-label={t('Explicación del paso {n}', { n: cur + 1 })}>
            <div className="note-editor-head">
              <button onClick={prevStep} disabled={cur === 0} aria-label={t('Paso anterior')}>‹</button>
              <b>{t('Paso')}{' '}{cur + 1}/{nFrames}</b>
              <button onClick={nextStep} disabled={cur >= nFrames - 1} aria-label={t('Paso siguiente')}>›</button>
              <span className="muted small">{frames[cur].note.length}</span>
              <button className="primary" onClick={() => setNoteOpen(false)}>{t('Listo')}</button>
            </div>
            <textarea autoFocus rows={4} placeholder={t('Explica este paso')} value={frames[cur].note} onChange={(e) => setNote(e.target.value)} />
          </div>
        )}
        {video !== null && (
          <div className="toast" role="status">{t('Exportando')}{' '}{progressLabel}{Math.round(video * 100)}%</div>
        )}
        {showHint && (
          <div className="hint" role="note">
            <p><b>{t('S Pen:')}</b> {' '}{t('toca una ficha con el lápiz para moverla y toca el césped para dibujar. Mantén el botón lateral para borrar.')}</p>
            <p><b>{t('Animaciones:')}</b> {' '}{t('abre Plantillas y elige una marcada con ▶. Luego pulsa Reproducir.')}</p>
            <div className="hint-actions">
              <button className="primary" onClick={() => { closeHint(); setSheet('help') }}>{t('Cómo empezar')}</button>
              <button onClick={closeHint}>{t('Entendido')}</button>
            </div>
          </div>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
        {saveFail && !saveFail.ok && (
          <div className="save-fail" role="alert">
            <span>{saveFail.reason === 'lleno' ? t('No se está guardando: este dispositivo no tiene espacio. Tu pizarra sigue abierta.') : t('No se está guardando: este navegador no deja guardar (¿modo incógnito?). Tu pizarra sigue abierta.')}</span>
            <button onClick={() => setSheet('plays')}>{t('Hacer una copia')}</button>
          </div>
        )}
        {label && (
          <div className="scrim" onClick={() => setLabel(null)}>
            <form className="sheet label-sheet" role="dialog" aria-label={t('Letrero')} onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); saveLabel(label.text) }}>
              <div className="sheet-head">
                <h2>{label.id ? t('Editar letrero') : t('Nuevo letrero')}</h2>
                <button type="button" onClick={() => setLabel(null)}>{t('Cancelar')}</button>
              </div>
              <textarea id="label-text" autoFocus rows={3} maxLength={120} placeholder={t('Escribe el mensaje, por ejemplo: ¡Presión aquí!')} value={label.text} onChange={(e) => setLabel({ ...label, text: e.target.value })} />
              <div className="label-preview" style={{ background: label.bg === 'none' ? 'transparent' : label.bg, color: label.color, fontSize: `${label.fs * 7}px`, border: label.bg === LABEL_DEFAULT_BG ? `1px solid ${label.color}` : undefined }}>{label.text.trim() || t('Vista previa')}</div>
              <div className="label-opts">
                <span>{t('Color de letra')}</span>
                <div className="colors" role="group" aria-label={t('Color de letra')}>
                  {LABEL_TEXT_COLORS.map((c) => <button type="button" key={c} aria-label={`${t('Color de letra')} ${c}`} className={label.color === c ? 'on' : ''} style={{ background: c }} onClick={() => setLabel({ ...label, color: c })} />)}
                </div>
                <span>{t('Color de fondo')}</span>
                <div className="colors" role="group" aria-label={t('Color de fondo')}>
                  {LABEL_BG_COLORS.map((c) => <button type="button" key={c} aria-label={c === 'none' ? t('Sin fondo') : `${t('Color de fondo')} ${c}`} title={c === 'none' ? t('Sin fondo') : undefined} className={(label.bg === c ? 'on' : '') + (c === 'none' ? ' none' : '')} style={c === 'none' ? undefined : { background: c }} onClick={() => setLabel({ ...label, bg: c })} />)}
                </div>
                <span>{t('Tamaño de letra')}</span>
                <div className="seg" role="group" aria-label={t('Tamaño de letra')}>
                  {LABEL_SIZES.map((s) => <button type="button" key={s.fs} className={label.fs === s.fs ? 'on' : ''} onClick={() => setLabel({ ...label, fs: s.fs })}>{t(s.name)}</button>)}
                </div>
              </div>
              <p className="muted small">{t('Sale en la pizarra, el proyector, las imágenes y los vídeos. Para moverlo, arrástralo con el dedo o el lápiz; tócalo sin moverlo para editarlo.')}</p>
              <div className="backup-actions">
                <button className="primary" type="submit">{label.id ? t('Guardar') : t('Poner en el campo')}</button>
                {label.id && <button type="button" className="danger" onClick={() => saveLabel('', true)}>{t('Quitar letrero')}</button>}
              </div>
            </form>
          </div>
        )}
        {ready && (
          <div className="videoready" role="dialog" aria-label={t('Exportación lista')}>
            <b>{ready.length > 1 ? t('{n} archivos listos', { n: ready.length }) : ready[0].type === 'image/png' ? t('Imagen lista') : t('Vídeo listo')}</b>
            <button className="primary" onClick={shareReady}>{t('Compartir')}</button>
            <button onClick={saveReady}>{t('Guardar')}</button>
            <button onClick={() => setReady(null)} aria-label={t('Cerrar')}>✕</button>
          </div>
        )}
      </main>

      {sel && !playing && (
        <SelBar sel={sel} updateSel={updateSel} removeSelected={removeSelected} />
      )}
      <StepBar frames={frames} cur={cur} shown={shown} playing={playing} play={play} prevStep={prevStep} nextStep={nextStep} glide={glide}
        setNote={setNote} openNote={() => setNoteOpen(true)} addStep={addStep} removeStep={removeStep} pace={pace} setPace={setPace} exporting={video !== null} setSheet={setSheet} />

      <ToolBar tool={tool} pickTool={pickTool} side={side} color={color} setColor={setColor} activeDraw={activeDraw} penSeen={penSeen}
        clearDrawings={() => commit((b) => ({ ...b, drawings: [], frames: b.frames?.map((f, i) => (i === cur ? { ...f, drawings: [] } : f)) }))}
        canClear={!!board.drawings.length || !!stepDrawings.length} vertical={vertical} toggleVertical={toggleVertical} setSheet={setSheet} />

      {sheet === 'help' && <HelpSheet onClose={() => setSheet(null)} />}
      {sheet === 'templates' && <TemplatesSheet onOpen={(tpl) => openTemplate(tpl)} onClose={() => setSheet(null)} />}
      {sheet === 'material' && <MaterialSheet art={art} onPick={(k) => { addToken(k); setSheet(null) }} onClose={() => setSheet(null)} />}
      {sheet === 'sessions' && <SessionsSheet onOpen={(tpl) => openTemplate(tpl)} onClose={() => setSheet(null)} />}
      {sheet === 'learn' && <LearnSheet onOpen={openTemplate} onClose={() => setSheet(null)} />}
      {sheet === 'look' && <LookSheet look={look} setLook={setLook} onClose={() => setSheet(null)} />}
      {sheet === 'tips' && <TipsSheet onClose={() => setSheet(null)} />}
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
      {sheet === 'plays' && <PlaysSheet board={board} onOpen={(b) => { load(b); setSheet(null) }} onClose={() => setSheet(null)} onSaved={() => setToast(t('Jugada guardada'))} onImported={prefs.recargar} />}
      {present && (
        <div className="present" ref={presentRef} role="dialog" aria-label={t('Modo proyector')}>
          {frames && frames.some((f) => f.note) && (
            <div className="present-note" aria-live="polite">
              {/* Al cambiar de paso el texto nuevo aparece fundido sobre el anterior, sin corte. */}
              <span style={{ opacity: Math.max(0, cap.fade * 2 - 1) }}><b>{t('Paso')}{' '}{cap.k + 1}/{nFrames}</b> {tr(frames[cap.k].note)}</span>
              {cap.fade < 0.5 && <span aria-hidden="true" style={{ opacity: 1 - cap.fade * 2 }}><b>{t('Paso')}{' '}{cap.prev + 1}/{nFrames}</b> {tr(frames[cap.prev].note)}</span>}
            </div>
          )}
          {/* Se proyecta con la misma orientación que se ve en la pizarra. */}
          <svg viewBox={vertical ? `${-PAD} ${-PAD} ${H + 2 * PAD} ${W + 2 * PAD}` : `${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`} className="present-board">
            <Markers />
            <g transform={vertical ? `translate(${H} 0) rotate(90)` : undefined}>
              <Scene board={board} s={anim ?? cur} zones={zones} brand={mark} ident={ident} look={look} upright={vertical} />
            </g>
          </svg>
          {frames && <button className="present-zone left" onClick={prevStep} aria-label={t('Paso anterior')} />}
          {frames && <button className="present-zone right" onClick={nextStep} aria-label={t('Paso siguiente')} />}
          <div className="present-bar">
            {frames && (
              <>
                <button onClick={prevStep} disabled={cur === 0 && anim === null} aria-label={t('Paso anterior')}>‹</button>
                <button className="primary" onClick={play}>{playing ? t('❚❚ Pausa') : t('▶ Reproducir')}</button>
                <button onClick={nextStep} disabled={cur >= nFrames - 1 && anim === null} aria-label={t('Paso siguiente')}>›</button>
              </>
            )}
            <button onClick={closePresent}>{t('Salir')}</button>
          </div>
        </div>
      )}
    </div>
  )
}
