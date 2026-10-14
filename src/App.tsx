import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  COLORS, DEFAULT_COLOR, EQUIPMENT, KIND_NAME, PITCH, TOOL_NAME, ballAt, item, player, posAt, uid,
  type Board, type TokenKind, type DrawTool, type Drawing, type PitchKind, type Pt, type Team, type Token, type Tool,
} from './model'
import { Equipment, Markers } from './Shapes'
import { Scene } from './Scene'
import { SEG_MS, shownStep } from './motion'
import { SESSIONS } from './sessions'
import { TEMPLATES, emptyBoard } from './templates'
import { deletePlay, listPlays, loadLast, saveLast, savePlay, type SavedPlay } from './storage'
import { exportPng } from './exportPng'

const PAD = 3
const DRAW_TOOLS: DrawTool[] = ['pass', 'run', 'dribble', 'zone', 'free']
const TOOLS: Tool[] = ['move', ...DRAW_TOOLS, 'erase']

type Action =
  | { kind: 'move'; id: string; dx: number; dy: number }
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
  const [sheet, setSheet] = useState<'templates' | 'plays' | 'material' | 'sessions' | null>(null)
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

  // Reproducción continua de principio a fin, sin paradas entre pasos.
  const startPlay = (fromStart = false) => {
    if (nFrames < 2) return
    cancelAnimationFrame(raf.current)
    setSelected(null)
    const start = fromStart || cur >= nFrames - 1 ? 0 : (animRef.current ?? cur)
    if (reduced()) { setAnim(null); setStep(nFrames - 1); return }
    setPlaying(true)
    setStep(Math.floor(start))
    setAnim(start)
    const t0 = performance.now() + (start === 0 ? 500 : 0)
    const tick = (now: number) => {
      const s = Math.min(nFrames - 1, start + Math.max(0, now - t0) / SEG_MS)
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

  // El vídeo se crea fotograma a fotograma; al terminar se ofrece compartir (WhatsApp, etc.) o guardar.
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const doVideo = async () => {
    if (!frames || video !== null) return
    stopAnim()
    setVideo(0)
    try {
      const { exportVideo } = await import('./exportVideo')
      const res = await exportVideo(board, { zones, onProgress: setVideo })
      if (res === 'unsupported') setToast('Este navegador no puede crear vídeo. Prueba con Chrome actualizado.')
      else setVideoFile(res.file)
    } catch {
      setToast('No se pudo crear el vídeo')
    } finally {
      setVideo(null)
    }
  }
  const shareVideo = async () => {
    if (!videoFile) return
    const { shareFile, saveFile } = await import('./exportVideo')
    if (!(await shareFile(videoFile))) { saveFile(videoFile); setToast('Vídeo guardado') }
    setVideoFile(null)
  }
  const saveVideo = async () => {
    if (!videoFile) return
    const { saveFile } = await import('./exportVideo')
    saveFile(videoFile)
    setToast('Vídeo guardado')
    setVideoFile(null)
  }

  const addStep = () => {
    stopAnim()
    commit((b) => {
      const f = b.frames ?? [{ pos: {}, drawings: [], note: '' }]
      return { ...b, frames: [...f.slice(0, cur + 1), { pos: {}, drawings: [], note: '' }, ...f.slice(cur + 1)] }
    })
    setStep(nFrames ? cur + 1 : 1)
    setToast('Paso añadido: mueve las fichas a su nueva posición')
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
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
      setSelected(t ? t.id : null)
      if (t) {
        const [x, y] = posAt(board, t, cur)
        action.current = { kind: 'move', id: t.id, dx: x - p[0], dy: y - p[1] }
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
      setBoard((b) => {
        // En el paso 0 se mueve la posición inicial; en los demás, solo la de ese paso.
        if (b.frames && cur > 0)
          return { ...b, frames: b.frames.map((f, i) => (i === cur ? { ...f, pos: { ...f.pos, [a.id]: [nx, ny] } } : f)) }
        return { ...b, tokens: b.tokens.map((t) => (t.id === a.id ? { ...t, x: nx, y: ny } : t)) }
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

  const doExport = async () => {
    if (!svg.current) return
    const res = await exportPng(svg.current)
    setToast(res === 'shared' ? 'Imagen compartida' : res === 'saved' ? 'Imagen guardada' : 'No se pudo exportar la imagen en este navegador')
  }

  const vb = vertical
    ? `${-PAD} ${-PAD} ${H + 2 * PAD} ${W + 2 * PAD}`
    : `${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`
  const activeDraw = tool === 'move' || tool === 'erase' ? penTool : tool
  const shown = anim !== null ? shownStep(board, anim) : cur
  const stepDrawings = frames ? frames[cur].drawings : []

  return (
    <div className="app">
      <header className="top">
        <strong className="brand">TacticalPro</strong>
        <div className="seg" role="group" aria-label="Tipo de campo">
          {(Object.keys(PITCH) as PitchKind[]).map((k) => (
            <button key={k} className={board.pitch === k ? 'on' : ''} onClick={() => setPitch(k)}>
              {k === 'full' ? 'Campo' : k === 'half' ? 'Medio' : '40×30'}
            </button>
          ))}
        </div>
        <button onClick={() => setSheet('templates')}>Plantillas</button>
        <button onClick={() => setSheet('sessions')}>Sesiones</button>
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
        <button onClick={doExport}>Exportar</button>
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
            <Scene board={board} s={anim ?? cur} zones={zones} upright={vertical} selected={selected} live={live} />
          </g>
        </svg>
        {frames && frames[shown].note && !showHint && (
          <div className="note" aria-live="polite"><b>Paso {shown + 1}.</b> {frames[shown].note}</div>
        )}
        {video !== null && (
          <div className="toast" role="status">Creando vídeo… {Math.round(video * 100)}%</div>
        )}
        {showHint && (
          <div className="hint" role="note">
            <p><b>S Pen:</b> toca una ficha con el lápiz para moverla y toca el césped para dibujar. Mantén el botón lateral para borrar.</p>
            <p><b>Animaciones:</b> abre Plantillas y elige una marcada con ▶. Luego pulsa Reproducir.</p>
            <button onClick={() => { setShowHint(false); try { localStorage.setItem('pizarra.ayuda.v2', '1') } catch { /* sin almacenamiento */ } }}>Entendido</button>
          </div>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
        {videoFile && (
          <div className="videoready" role="dialog" aria-label="Vídeo listo">
            <b>Vídeo listo</b>
            <button className="primary" onClick={shareVideo}>Compartir</button>
            <button onClick={saveVideo}>Guardar</button>
            <button onClick={() => setVideoFile(null)} aria-label="Cerrar">✕</button>
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
              <button onClick={doVideo} disabled={video !== null}>Exportar vídeo</button>
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
          {(['Sistemas', 'ABP', 'Ejercicios'] as const).map((g) => (
            <section key={g}>
              <h3>{g === 'ABP' ? 'Acciones a balón parado' : g}</h3>
              <div className="list">
                {TEMPLATES.filter((t) => t.group === g).map((t) => (
                  <button key={t.id} className="row" onClick={() => { load(t.build()); setSheet(null); if (t.animated) setAutoplay(true) }}>
                    {t.animated && <span className="anim-badge">▶</span>}{t.name}
                  </button>
                ))}
              </div>
            </section>
          ))}
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
      {sheet === 'plays' && <PlaysSheet board={board} onOpen={(b) => { load(b); setSheet(null) }} onClose={() => setSheet(null)} onSaved={() => setToast('Jugada guardada')} />}
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
      {t === 'free' && <path d="M4 17c3-6 6 2 9-3s4-6 7-5" {...s} />}
      {t === 'erase' && <><path d="M8 20h12" {...s} /><path d="M4 15l9-9 6 6-7 7H8z" {...s} /></>}
    </svg>
  )
}
