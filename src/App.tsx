import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MOVES_BALL, MOVES_PLAYER,
  DEFAULT_LOOK, type GrassKind, type Look, PITCH, ballAt, item, player, posAt, uid,
  type Board, type TokenKind, type DrawTool, type Drawing, type PitchKind, type Pt, type Token, type Tool,
  LABEL_BG_COLORS, LABEL_DEFAULT_BG, LABEL_SIZES, LABEL_TEXT_COLORS,
} from './nucleo/model'
import { Markers } from './pantalla/Shapes'
import { useArt } from './pantalla/material'
import { Scene } from './pantalla/Scene'
import { SPEEDS, caption, clipRate, paceAt, paceStart, sampleAt, shownStep, type Speed } from './nucleo/motion'
import { Sim, HOLD, clipStep, holdAt, holdTotal, holdWall, keyPasses, readHolds, clipToSteps, stepsToClip, withMarks, newClip, smoothTrack, trimPauses, type Clip, type ClipView, type Focus } from './pro/clip'
import { PERSONAL, PRO, numberPlayers as numberOnly } from './pro/pro'
import { movesFromArrows, settleBall } from './nucleo/steps'
import { TEMPLATES, emptyBoard } from './contenido/templates'
import type { Template } from './contenido/anim'
import { loadLast } from './nucleo/storage'
import { isTyping } from './nucleo/keys'
import { endFor, isIdentityMode, markFor } from './nucleo/identity'
import type { ExportOpts } from './exportar/exportVideo'
import { t, tr } from './i18n'
import { useHistorial } from './nucleo/historial'
import { aCampo, useEntradaCampo } from './pantalla/campo/entrada'
import type { LabelEdit } from './pantalla/campo/letrero'
import { SelBar, StepBar, ToolBar, TopBar, type SheetId } from './pantalla/barras'
import { ExportSheet, HelpSheet, IdentitySheet, LearnSheet, LookSheet, MaterialSheet, PlaysSheet, Preview, SessionsSheet, TemplatesSheet, TipsSheet } from './pantalla/hojas'
import { useAutoguardado } from './nucleo/guardado'
import { ayudaVista, guardarEstiloLetrero, primeraVez, useOrientacion, usePreferencias } from './nucleo/preferencias'

const PAD = 3

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

// Fichas al abrir la pizarra personal: se quitan formas que ya no existen y la primera vez se estrena la camiseta élite.
function leerFichasPro(): Look {
  try {
    const l: Look = { ...DEFAULT_LOOK, ...JSON.parse(localStorage.getItem('pizarra.fichas') ?? '{}') }
    // Las fichas con forma de muñeco se quitaron: quien las tuviera vuelve a la ficha pro.
    if (!['pro', 'disc', 'shirt', 'kit', 'alu', 'perfil'].includes(l.shape) || (['kit', 'alu', 'perfil'].includes(l.shape) && !PRO)) { l.shape = 'pro'; localStorage.setItem('pizarra.fichas', JSON.stringify(l)) }
    // Pizarra personal: la primera vez se estrena la camiseta élite (amarilla contra azul).
    if (PERSONAL && !localStorage.getItem('pizarra.kitVisto')) {
      Object.assign(l, { shape: 'kit', home: '#ffd23f', away: '#5bb6ff' })
      localStorage.setItem('pizarra.kitVisto', '1'); localStorage.setItem('pizarra.fichas', JSON.stringify(l))
    }
    return l
  } catch { return DEFAULT_LOOK }
}

export default function App() {
  // La pizarra abierta y su historial para deshacer y rehacer.
  const historial = useHistorial(() => { const l = loadLast(); return l ? withMarks(inLang(l)) : numberPlayers(TEMPLATES.find((t) => t.animated)!.build()) })
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
  const prefs = usePreferencias(() => setToast(t('No se pudo guardar en el dispositivo: prueba con un escudo más ligero')), leerFichasPro)
  const { zones, toggleZones, pace, setPace, look, setLook, brand, setBrand, brandMode, setBrandMode, idStore, setIdStore, endCard, setEnd, vopts, setVopts } = prefs

  // Animación
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  // Instante de la animación en pasos (1.5 = a mitad entre el paso 2 y el 3). null = quieto en `step`.
  const [anim, setAnimState] = useState<number | null>(null)
  const animRef = useRef<number | null>(null)
  const setAnim = (s: number | null) => { animRef.current = s; setAnimState(s) }
  const raf = useRef(0)
  // Jugada grabada: segundo en el que está parada.
  const [clipT, setClipT] = useState(0)
  const [focus, setFocus] = useState<Focus | null>(null)
  const [video, setVideo] = useState<number | null>(null)

  const stage = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const layer = useRef<SVGGElement>(null)

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
    setFocus(null)
    cancelAnimationFrame(raf.current)
    if (animRef.current !== null) { setStep(Math.round(animRef.current)); setClipT(animRef.current) }
    animRef.current = null
    setAnimState(null)
    setPlaying(false)
  }, [])

  // Cargar una pizarra nueva (plantilla, jugada guardada o campo vacío).
  const load = useCallback((b: Board) => {
    stopAnim()
    commit(withMarks(inLang(b)))
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
    if (board.clip) { if (fromStart) setClipT(0); playClipFrom(fromStart ? 0 : null); return }
    if (nFrames < 2) return
    cancelAnimationFrame(raf.current)
    setSelected(null)
    const start = fromStart || cur >= nFrames - 1 ? 0 : (animRef.current ?? cur)
    if (reduced()) { setAnim(null); setStep(nFrames - 1); return }
    setPlaying(true)
    setStep(Math.floor(start))
    setAnim(start)
    // Si se reanuda a mitad, se sigue desde el inicio del paso en el que estaba.
    const t0 = performance.now() - paceStart(Math.floor(start), pace) * 1000
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

  // Jugada grabada: se reproduce en tiempo real, de seguido.
  const playClip = () => { if (playing) stopAnim(); else playClipFrom(null) }
  function playClipFrom(from: number | null) {
    const clip = board.clip
    if (!clip) return
    cancelAnimationFrame(raf.current)
    setSelected(null)
    const start = from ?? (clipT >= clip.dur - 0.05 ? 0 : clipT)
    setPlaying(true)
    setAnim(start)
    // Se cuenta el tiempo de reproducción (con las pausas de los momentos clave) y se pasa al de la jugada.
    const t0 = performance.now(), rate = clipRate(pace), reads = readHolds(clip, (board.frames ?? []).map((f) => f.note && tr(f.note)))
    const w0 = holdWall(clip, start, reads), total = holdTotal(clip, reads)
    const tick = (now: number) => {
      const w = w0 + ((now - t0) / 1000) * rate
      if (w < total) { const h = holdAt(clip, w, reads); setFocus(h.focus); setAnim(h.s); raf.current = requestAnimationFrame(tick) }
      else { animRef.current = null; setAnimState(null); setFocus(null); setClipT(clip.dur); setPlaying(false) }
    }
    raf.current = requestAnimationFrame(tick)
  }
  const play = () => {
    if (board.clip) { playClip(); return }
    // Pausa: termina de llegar al paso que estaba en camino.
    if (playing) { glide(Math.ceil((animRef.current ?? cur) - 1e-6)); return }
    startPlay()
  }
  const nextStep = () => glide(Math.min(nFrames - 1, Math.floor((animRef.current ?? cur) + 1e-6) + 1))
  const prevStep = () => glide(Math.max(0, Math.ceil((animRef.current ?? cur) - 1e-6) - 1))

  // Pizarra personal: camisetas de marca (PRO junto al logo y bienvenida con las tres al abrir).
  const [brandArt, setBrandArt] = useState<{ pro: string; trio: string } | null>(null)
  const [welcome, setWelcome] = useState(PERSONAL)
  useEffect(() => { if (PERSONAL) void import('./pro/brandShirts').then((m) => setBrandArt(m.default)) }, [])
  useEffect(() => {
    if (!welcome || !brandArt) return
    const id = setTimeout(() => setWelcome(false), 3200)
    return () => clearTimeout(id)
  }, [welcome, brandArt])

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
      const ex = await import('./exportar/exportVideo')
      const opts = exportOpts
      let files: File[]
      if (image) files = [await ex.exportImage(items[0].board, { ...opts, s: cur })]
      else if (items.length === 1 && (items[0].board.frames || items[0].board.clip)) {
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
  // Jugada de pasos que también se ve en tiempo real: el vídeo puede salir por pasos (con su tiempo para leer) o en tiempo real.
  const bothModes = !!board.clip && (board.frames?.length ?? 0) > 1
  const [videoLive, setVideoLive] = useState(false)
  const videoBoard = bothModes && !videoLive ? { ...board, clip: undefined } : board
  const doVideo = () => runExport([{ name: 'jugada', board: videoBoard }])
  const shareReady = async () => {
    if (!ready) return
    const { shareFiles, saveFiles } = await import('./exportar/exportVideo')
    if (await shareFiles(ready)) { setReady(null); return }
    try { await saveFiles(ready); setToast(ready.length > 1 ? t('Archivos guardados') : t('Archivo guardado')); setReady(null) } catch { setToast(t('No se pudo guardar')) }
  }
  const saveReady = async () => {
    if (!ready) return
    const { saveFiles } = await import('./exportar/exportVideo')
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

  // ── Grabar en vivo (Pro) ──
  // Pulsas Grabar, cuenta 3-2-1 y arrastras jugadores en tiempo real (con varios dedos a la vez si quieres) mientras
  // lo grabado antes se reproduce. Tocar a un compañero le pasa el balón; arrastrar el balón y soltarlo es un pase
  // hacia donde lo sueltas. Cada vez que grabas se añade una capa: así se monta un rondo o una jugada completa.
  type Drag = { id: string; dx: number; dy: number; x0: number; y0: number; at: number; moved: boolean; ball: boolean }
  const recRef = useRef<{ sim: Sim; clip: Clip; live: Record<string, Pt>; drags: Map<number, Drag>; from: Record<string, number>; t0: number; board: Board } | null>(null)
  const [rec, setRec] = useState<{ phase: 'count' | 'rec'; t: number } | null>(null)
  const [recView, setRecView] = useState<ClipView | null>(null)
  const recRaf = useRef(0)
  const REC_MAX = 90
  const startRec = () => {
    stopAnim()
    setSelected(null)
    setLive(null)
    let b = board
    if (b.frames && b.clip) b = { ...b, frames: undefined }
    else if (b.frames) {
      // Se parte de cómo están las fichas en el paso que ves; los pasos se sustituyen por la grabación (se puede deshacer).
      b = { ...b, tokens: b.tokens.map((tk) => { const p = sampleAt(b, tk, cur); return { ...tk, x: p[0], y: p[1] } }), frames: undefined }
      commit(b)
      setStep(0)
      setToast(t('La grabación sustituye a los pasos. Si te equivocas, pulsa Deshacer.'))
    }
    const clip: Clip = b.clip ? { ...b.clip, tracks: Object.fromEntries(Object.entries(b.clip.tracks).map(([k, v]) => [k, [...v]])), passes: [...b.clip.passes] } : newClip(true)
    const live: Record<string, Pt> = {}
    const sim = new Sim({ ...b, clip }, clip, { live: () => live })
    recRef.current = { sim, clip, live, drags: new Map(), from: {}, t0: 0, board: b }
    setRecView(sim.view())
    setRec({ phase: 'count', t: 3 })
    const c0 = performance.now()
    const count = (now: number) => {
      const left = 3 - (now - c0) / 1000
      if (left > 0) { setRec({ phase: 'count', t: left }); recRaf.current = requestAnimationFrame(count); return }
      const r = recRef.current
      if (!r) return
      r.t0 = now
      setRec({ phase: 'rec', t: 0 })
      recRaf.current = requestAnimationFrame(tick)
    }
    const tick = (now: number) => {
      const r = recRef.current
      if (!r) return
      const target = (now - r.t0) / 1000
      // Una muestra por cada 1/60 s para cada ficha que se está arrastrando.
      while (r.sim.t + 1 / 60 <= target + 1e-9) {
        r.sim.step()
        for (const [id, p] of Object.entries(r.live)) (r.clip.tracks[id] ??= []).push([+r.sim.t.toFixed(3), +p[0].toFixed(3), +p[1].toFixed(3)])
      }
      setRecView(r.sim.view())
      setRec({ phase: 'rec', t: r.sim.t })
      if (r.sim.t >= REC_MAX) { stopRec(); return }
      recRaf.current = requestAnimationFrame(tick)
    }
    recRaf.current = requestAnimationFrame(count)
  }
  const stopRec = () => {
    cancelAnimationFrame(recRaf.current)
    const r = recRef.current
    recRef.current = null
    setRec(null)
    setRecView(null)
    setLive(null)
    if (!r || r.t0 === 0) return
    for (const id of Object.keys(r.from)) if (r.clip.tracks[id]) r.clip.tracks[id] = smoothTrack(r.clip.tracks[id], r.from[id])
    const dur = Math.max(r.clip.dur, r.sim.t)
    if (!Object.keys(r.from).length && r.clip.passes.length === (r.board.clip?.passes.length ?? 0) && !r.board.clip) return
    // El rato quieto del final (hasta que pulsas Parar) se recorta solo.
    const full: Board = { ...r.board, frames: undefined, clip: { ...r.clip, dur: +dur.toFixed(3) } }
    commit({ ...full, clip: trimPauses(full, 0.7, Infinity) })
    setClipT(0)
    setToast(t('Grabación guardada. Pulsa ▶ Reproducir para verla o graba otra capa.'))
  }
  useEffect(() => () => cancelAnimationFrame(recRaf.current), [])
  const recNearest = (p: Pt, e: React.PointerEvent, view: ClipView) => {
    const ctm = layer.current!.getScreenCTM()!
    const r0 = PITCH[board.pitch].r
    const reach = Math.max(r0 * 1.5, (e.pointerType === 'touch' ? 22 : 10) / Math.hypot(ctm.a, ctm.b))
    let best = reach, id: string | null = null
    for (const tk of board.tokens) {
      if (tk.kind !== 'player' && tk.kind !== 'ball') continue
      const q = view.pos[tk.id] ?? [tk.x, tk.y]
      // El balón tiene un poco de preferencia: está pegado a un jugador y si no costaría cogerlo.
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]) * (tk.kind === 'ball' ? 0.7 : 1)
      if (d < best) { best = d; id = tk.id }
    }
    return id
  }
  const recDown = (e: React.PointerEvent) => {
    const r = recRef.current
    if (!r || !rec || rec.phase !== 'rec') return
    const p = toBoard(e)
    const view = r.sim.view()
    const id = recNearest(p, e, view)
    if (!id) return
    try { svg.current?.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
    const q = view.pos[id]
    const ball = board.tokens.find((tk) => tk.id === id)?.kind === 'ball'
    r.drags.set(e.pointerId, { id, dx: q[0] - p[0], dy: q[1] - p[1], x0: p[0], y0: p[1], at: performance.now(), moved: false, ball })
  }
  const recMove = (e: React.PointerEvent) => {
    const r = recRef.current
    const d = r?.drags.get(e.pointerId)
    if (!r || !d) return
    const p = toBoard(e)
    if (d.ball) {
      setLive({ id: 'rec-pass', type: 'pass', color: '#ffffff', width: 0.3, points: [r.sim.ball, p] })
      return
    }
    if (!d.moved && Math.hypot(p[0] - d.x0, p[1] - d.y0) < 0.5) return
    const pos: Pt = [Math.max(-2, Math.min(W + 2, p[0] + d.dx)), Math.max(-2, Math.min(H + 2, p[1] + d.dy))]
    if (!d.moved) {
      d.moved = true
      // Esta ficha se vuelve a grabar desde ahora: lo que tenía grabado después se quita.
      const tr = (r.clip.tracks[d.id] ?? []).filter((x) => x[0] < r.sim.t)
      r.clip.tracks[d.id] = tr
      if (!(d.id in r.from)) r.from[d.id] = tr.length
      const cur0 = r.sim.pos[d.id]
      tr.push([+r.sim.t.toFixed(3), +cur0[0].toFixed(3), +cur0[1].toFixed(3)])
      d.dx = cur0[0] - p[0]; d.dy = cur0[1] - p[1]
      r.live[d.id] = cur0
      return
    }
    r.live[d.id] = pos
  }
  const recUp = (e: React.PointerEvent) => {
    const r = recRef.current
    const d = r?.drags.get(e.pointerId)
    if (!r || !d) return
    r.drags.delete(e.pointerId)
    const p = toBoard(e)
    if (d.ball) {
      setLive(null)
      // Pase hacia donde sueltas el balón: a un compañero si lo sueltas cerca de él; si no, a ese punto.
      const holderTeam = board.tokens.find((x) => x.id === r.sim.holder)?.team
      let to: string | null = null, best = 6
      for (const tk of board.tokens) {
        if (tk.kind !== 'player' || tk.id === r.sim.holder) continue
        // El pase va a un compañero, no a un rival que esté cerca.
        if (holderTeam && tk.team !== holderTeam && tk.team !== 'neutral' && holderTeam !== 'neutral') continue
        const q = r.sim.pos[tk.id]
        const dd = Math.hypot(q[0] - p[0], q[1] - p[1])
        if (dd < best) { best = dd; to = tk.id }
      }
      if (to) r.sim.pass(to)
      else if (Math.hypot(p[0] - r.sim.ball[0], p[1] - r.sim.ball[1]) > 1.5) r.sim.pass(null, p)
      return
    }
    if (!d.moved) {
      // Toque rápido sobre un jugador: pase a él.
      if (performance.now() - d.at < 450 && d.id !== r.sim.holder) {
        // Si tocas cerca de un rival pero hay un compañero al lado, el pase es para el compañero.
        const team = (id: string | null) => board.tokens.find((x) => x.id === id)?.team
        const ht = team(r.sim.holder)
        let to = d.id
        if (ht && ht !== 'neutral' && team(d.id) !== ht && team(d.id) !== 'neutral') {
          const reach = PITCH[board.pitch].r * 3
          let best = reach
          for (const tk of board.tokens) {
            if (tk.kind !== 'player' || tk.id === r.sim.holder || (tk.team !== ht && tk.team !== 'neutral')) continue
            const q = r.sim.pos[tk.id], dd = Math.hypot(q[0] - p[0], q[1] - p[1])
            if (dd < best) { best = dd; to = tk.id }
          }
        }
        r.sim.pass(to)
      }
      return
    }
    const q = r.live[d.id]
    delete r.live[d.id]
    if (q) r.clip.tracks[d.id].push([+(r.sim.t + 0.001).toFixed(3), +q[0].toFixed(3), +q[1].toFixed(3)])
  }
  const cutPauses = () => {
    if (!board.clip) return
    stopAnim()
    const c = trimPauses(board)
    if (c === board.clip) { setToast(t('No hay tiempos muertos que quitar.')); return }
    const saved = board.clip.dur - c.dur
    commit((b) => ({ ...b, clip: c }))
    setClipT(0)
    setToast(t('Quitados {s} s de tiempos muertos. Si no te gusta, pulsa Deshacer.', { s: saved.toFixed(1) }))
  }
  const toSteps = () => {
    if (!board.clip) return
    stopAnim()
    const nb = clipToSteps(board)
    commit(nb)
    setStep(0)
    setPace({ flow: true })
    setToast(t('Listo: {n} pasos. Escribe la explicación de cada uno. Si no te gusta, pulsa Deshacer.', { n: nb.frames!.length }))
  }
  const toLive = () => {
    if (!board.frames) return
    stopAnim()
    commit(stepsToClip(board))
    setClipT(0)
    setAutoplay(true)
  }
  const clearClip = () => { stopAnim(); commit((b) => ({ ...b, clip: undefined })); setClipT(0) }
  // Momentos clave: la jugada se congela un instante en los pases que más hacen avanzar, o donde tú digas.
  const toggleKeys = () => {
    if (!board.clip) return
    stopAnim()
    if (board.clip.keys?.length) { commit((b) => (b.clip ? { ...b, clip: { ...b.clip, keys: undefined } } : b)); setToast(t('Momentos clave quitados')); return }
    const keys = keyPasses(board)
    if (!keys.length) { setToast(t('No encontré pases que hagan avanzar mucho. Para la jugada donde quieras y pulsa «★ Pausa aquí».')); return }
    commit((b) => (b.clip ? { ...b, clip: { ...b.clip, keys } } : b))
    setToast(t('{n} momentos clave: la jugada se para {s} s en cada uno.', { n: keys.length, s: HOLD.toFixed(1) }))
  }
  const addKey = () => {
    if (!board.clip) return
    const k = +clipT.toFixed(3)
    if (board.clip.keys?.some((x) => Math.abs(x - k) < 0.3)) {
      commit((b) => (b.clip ? { ...b, clip: { ...b.clip, keys: b.clip.keys!.filter((x) => Math.abs(x - k) >= 0.3) } } : b))
      setToast(t('Pausa quitada'))
      return
    }
    commit((b) => (b.clip ? { ...b, clip: { ...b.clip, keys: [...(b.clip.keys ?? []), k].sort((x, y) => x - y) } } : b))
    setToast(t('Pausa añadida: aquí la jugada se para y resalta el pase que viene.'))
  }
  const toggleShow = (k: 'offside' | 'vision') => commit((b) => (b.clip ? { ...b, clip: { ...b.clip, show: { ...b.clip.show, [k]: !b.clip.show?.[k] } } } : b))
  const toggleAuto = () => commit((b) => (b.clip ? { ...b, clip: { ...b.clip, auto: !b.clip.auto } } : b))

  // Tocar, arrastrar, dibujar y borrar sobre el campo (dedo, ratón o lápiz).
  const { onDown, onMove, onUp } = useEntradaCampo({
    board, setBoard, cur, W, H, layer, svg, tool, penTool, color, penSeen, setPenSeen, playing, anim, stopAnim,
    setSelected, setLive, setLabel, apuntar, olvidar, refrescar,
    rec: rec ? { down: recDown, move: recMove, up: recUp } : null, avisar: setToast,
  })
  const toBoard = (e: React.PointerEvent) => aCampo(layer, e)

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
  const clipSt = board.clip?.marks ? clipStep(board.clip, anim ?? clipT) : null
  const cap = anim !== null ? caption(board, anim) : { k: cur, prev: cur, fade: 1 }
  const stepDrawings = frames ? frames[cur].drawings : []

  return (
    <div className="app">
      <TopBar board={board} side={side} zones={zones} toggleZones={toggleZones} newBoard={newBoard} setPitch={setPitch} addToken={addToken}
        undo={undo} redo={redo} canUndo={historial.puedeDeshacer} canRedo={historial.puedeRehacer} openPresent={openPresent} setSheet={setSheet}
        brandExtra={PRO && (brandArt ? <img className="pro-shirt" src={brandArt.pro} alt="PRO" /> : <em className="pro-tag">PRO</em>)}
        vistaExtra={PRO ? (close) => (<>
          <div className="tool-menu-title">{t('Césped')}</div>
          {(['clasico', 'dia', 'cuadros', 'noche'] as GrassKind[]).map((g) => (
            <button key={g} role="menuitemradio" aria-checked={(look.grass ?? 'clasico') === g} className={(look.grass ?? 'clasico') === g ? 'on' : ''}
              onClick={() => { setLook({ grass: g }); close() }}>
              {g === 'clasico' ? t('Clásico') : g === 'dia' ? t('Estadio de día') : g === 'cuadros' ? t('Cuadros') : t('Noche')}
            </button>
          ))}
        </>) : undefined}
        fichasLabel={PRO ? t('Fichas y colores') : undefined} />

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
            <Scene board={board} s={board.clip ? anim ?? clipT : anim ?? cur} view={recView} focus={board.clip ? focus : null} zones={zones} brand={mark} ident={ident} look={look} upright={vertical} selected={selected} live={live} ghost={anim === null && !playing} />
          </g>
        </svg>
        {frames && !board.clip && frames[shown].note && !showHint && (
          // Con el móvil de lado la explicación flota sobre el campo: al tocarla se pliega para ver todo el campo y al tocarla otra vez vuelve.
          <div className={`note${side && noteMini ? ' mini' : ''}`} aria-live="polite" onClick={side ? () => setNoteMini((m) => !m) : undefined}>
            <b>{t('Paso')}{' '}{shown + 1}.</b>{side && noteMini ? ' ▾' : <> {tr(frames[shown].note)}</>}
          </div>
        )}
        {frames && clipSt && frames[clipSt.i]?.note && !showHint && !rec && (
          <div className="note" aria-live="polite"><b>{t('Paso')}{' '}{clipSt.i + 1}.</b> {tr(frames[clipSt.i].note)}</div>
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
        {toast && !rec && <div className="toast" role="status">{toast}</div>}
        {rec && (
          <div className={`recbar${rec.phase === 'count' ? ' counting' : ''}`} role="status">
            {rec.phase === 'count' ? (
              <><b className="rec-count">{Math.ceil(rec.t)}</b><span>{t('Prepárate: arrastra jugadores con el dedo, el ratón o el lápiz. Toca a un compañero para pasarle el balón.')}</span></>
            ) : (
              <><b className="rec-dot">● REC</b><span className="rec-time">{rec.t.toFixed(1)} {t('s')}</span>
                <span className="muted small">{t('Arrastra jugadores (puedes usar dos dedos). Toca a un compañero para pasarle el balón.')}</span></>
            )}
            <button className="primary" onClick={stopRec}>{t('■ Parar')}</button>
          </div>
        )}
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
        setNote={setNote} openNote={() => setNoteOpen(true)} addStep={addStep} removeStep={removeStep} pace={pace} setPace={setPace} exporting={video !== null} setSheet={setSheet} sinPausas={PRO}
        clipBar={board.clip && (
            <>
              <button className="primary" onClick={play} disabled={!!rec} aria-label={playing ? t('Pausa') : t('Reproducir')}>{playing ? t('❚❚ Pausa') : t('▶ Reproducir')}</button>
              <input className="clip-time" type="range" min={0} max={board.clip.dur} step={0.01} value={Math.min(board.clip.dur, anim ?? clipT)} aria-label={t('Momento de la jugada')}
                onChange={(e) => { stopAnim(); setClipT(+e.target.value) }} disabled={!!rec} />
              <span className="muted small">{(anim ?? clipT).toFixed(1)} / {board.clip.dur.toFixed(1)} {t('s')}</span>
              <label className="pace">
                <span className="muted small">{t('Velocidad')}</span>
                <select value={pace.speed} onChange={(e) => { stopAnim(); setPace({ speed: e.target.value as Speed }) }} aria-label={t('Velocidad de la jugada')} disabled={!!rec}>
                  {SPEEDS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              {frames && board.clip.marks && clipSt && (
                <div className="steps" role="group" aria-label={t('Pasos de la animación')}>
                  {board.clip.marks.map((m, i) => (
                    <button key={i} className={i === clipSt.i ? 'on' : ''} aria-label={t('Ir al paso {n}', { n: i + 1 })} onClick={() => { stopAnim(); setClipT(m + 0.01) }} disabled={!!rec}>{i + 1}</button>
                  ))}
                </div>
              )}
              <span className="sep" />
              <button onClick={startRec} disabled={!!rec}>{t('● Grabar capa')}</button>
              <label className="pick"><input type="checkbox" checked={!!board.clip.auto} onChange={toggleAuto} disabled={!!rec} /><span>{t('Defensa automática')}</span></label>
              <button onClick={toggleKeys} disabled={!!rec} aria-pressed={!!board.clip.keys?.length} className={board.clip.keys?.length ? 'toggle on' : 'toggle'}>{t('★ Momentos clave')}</button>
              <button onClick={addKey} disabled={!!rec || playing}>{t('★ Pausa aquí')}</button>
              <label className="pick"><input type="checkbox" checked={!!board.clip.show?.offside} onChange={() => toggleShow('offside')} disabled={!!rec} /><span>{t('Fuera de juego')}</span></label>
              <label className="pick"><input type="checkbox" checked={!!board.clip.show?.vision} onChange={() => toggleShow('vision')} disabled={!!rec} /><span>{t('Visión y pases libres')}</span></label>
              <button onClick={cutPauses} disabled={!!rec}>{t('Quitar tiempos muertos')}</button>
              <button onClick={toSteps} disabled={!!rec}>{t('Convertir en pasos')}</button>
              <button onClick={clearClip} disabled={!!rec}>{board.frames ? t('Volver a pasos') : t('Borrar grabación')}</button>
              <button onClick={() => setSheet('export')} disabled={video !== null || !!rec}>{t('Exportar vídeo')}</button>
            </>
        )}
        stepExtra={PRO && (<>
          <button className="pro-anim" onClick={startRec} disabled={!!rec} title={t('Grabar los movimientos en tiempo real')}>{t('● Grabar')}</button>
          <button className="pro-anim" onClick={toLive} disabled={!!rec} title={t('Todos se mueven a la vez y de seguido, a velocidad real')}>{t('▶ Tiempo real')}</button>
        </>)}
        emptyExtra={PRO && <button onClick={startRec} disabled={!!rec} title={t('Grabar los movimientos en tiempo real')}>{t('● Grabar')}</button>} />

      <ToolBar tool={tool} pickTool={pickTool} side={side} color={color} setColor={setColor} activeDraw={activeDraw} penSeen={penSeen}
        clearDrawings={() => commit((b) => ({ ...b, drawings: [], frames: b.frames?.map((f, i) => (i === cur ? { ...f, drawings: [] } : f)) }))}
        canClear={!!board.drawings.length || !!stepDrawings.length} vertical={vertical} toggleVertical={toggleVertical} setSheet={setSheet} />

      {sheet === 'help' && <HelpSheet onClose={() => setSheet(null)} />}
      {sheet === 'templates' && <TemplatesSheet onOpen={(tpl) => openTemplate(tpl)} onClose={() => setSheet(null)} />}
      {sheet === 'material' && <MaterialSheet art={art} onPick={(k) => { addToken(k); setSheet(null) }} onClose={() => setSheet(null)} />}
      {sheet === 'sessions' && <SessionsSheet onOpen={(tpl) => openTemplate(tpl)} onClose={() => setSheet(null)} />}
      {sheet === 'learn' && <LearnSheet onOpen={openTemplate} onClose={() => setSheet(null)} />}
      {welcome && brandArt && (
        <button className="welcome" onClick={() => setWelcome(false)} aria-label={t('Abrir la pizarra')}>
          <img src={brandArt.trio} alt="TacticalPro PRO · Jesús Cortinas" />
          <span className="welcome-lema">{t('Aprende · Planifica · Entrena')}</span>
          <span className="welcome-go">{t('Toca para empezar')}</span>
        </button>
      )}
      {sheet === 'look' && <LookSheet look={look} setLook={setLook} onClose={() => setSheet(null)} />}
      {sheet === 'tips' && <TipsSheet onClose={() => setSheet(null)} />}
      {sheet === 'export' && (
        <ExportSheet
          hasFrames={!!frames || !!board.clip}
          bothModes={bothModes}
          videoLive={videoLive}
          setVideoLive={setVideoLive}
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
      {preview && (frames || board.clip) && (
        <Preview
          board={videoBoard}
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
              <Scene board={board} s={board.clip ? anim ?? clipT : anim ?? cur} focus={board.clip ? focus : null} zones={zones} brand={mark} ident={ident} look={look} upright={vertical} />
            </g>
          </svg>
          {frames && <button className="present-zone left" onClick={prevStep} aria-label={t('Paso anterior')} />}
          {frames && <button className="present-zone right" onClick={nextStep} aria-label={t('Paso siguiente')} />}
          <div className="present-bar">
            {board.clip && <button className="primary" onClick={play}>{playing ? t('❚❚ Pausa') : t('▶ Reproducir')}</button>}
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
