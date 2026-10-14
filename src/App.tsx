import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  COLORS, DEFAULT_COLOR, PITCH, TOOL_NAME, ballAt, coneAt, player, uid,
  type Board, type DrawTool, type Drawing, type PitchKind, type Pt, type Team, type Token, type Tool,
} from './model'
import { Pitch } from './Pitch'
import { DrawingShape, Markers, TokenShape } from './Shapes'
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
  try { return !localStorage.getItem('pizarra.ayuda') } catch { return true }
}

export default function App() {
  const [board, setBoard] = useState<Board>(() => loadLast() ?? TEMPLATES[0].build())
  const past = useRef<Board[]>([])
  const future = useRef<Board[]>([])
  const [, force] = useState(0)

  const [tool, setTool] = useState<Tool>('move')
  const [penTool, setPenTool] = useState<DrawTool>('pass')
  const [color, setColor] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [live, setLive] = useState<Drawing | null>(null)
  const [penSeen, setPenSeen] = useState(false)
  const [sheet, setSheet] = useState<'templates' | 'plays' | null>(null)
  const [showHint, setShowHint] = useState(hint)
  const [toast, setToast] = useState<string | null>(null)

  const stage = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const layer = useRef<SVGGElement>(null)
  const [size, setSize] = useState({ w: 1, h: 1 })
  const action = useRef<Action>({ kind: 'none' })
  const pointer = useRef<number | null>(null)
  const penDown = useRef(false)

  const { w: W, h: H, r } = PITCH[board.pitch]
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

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    setBoard((b) => { future.current.push(b); return prev })
    setSelected(null)
    force((x) => x + 1)
  }, [])
  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    setBoard((b) => { past.current.push(b); return next })
    force((x) => x + 1)
  }, [])

  const removeSelected = useCallback(() => {
    if (!selected) return
    commit((b) => ({ ...b, tokens: b.tokens.filter((t) => t.id !== selected) }))
    setSelected(null)
  }, [selected, commit])

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
    if (d) setBoard((b) => ({ ...b, drawings: b.drawings.filter((x) => x.id !== d) }))
    else if (t) setBoard((b) => ({ ...b, tokens: b.tokens.filter((x) => x.id !== t) }))
  }

  const onDown = (e: React.PointerEvent) => {
    if (pointer.current !== null) return
    const isPen = e.pointerType === 'pen'
    // Con el lápiz apoyado se ignora la palma de la mano.
    if (e.pointerType === 'touch' && penDown.current) return
    if (isPen && !penSeen) setPenSeen(true)
    const tokenId = (e.target as Element).closest('[data-token]')?.getAttribute('data-token') ?? null
    const p = toBoard(e)
    // Botón lateral del S Pen (2) o goma del lápiz (32): borrar.
    const penErase = isPen && (e.buttons & 2 || e.buttons & 32)
    const fingerWithPen = penSeen && e.pointerType === 'touch'

    let mode: 'move' | 'draw' | 'erase' = 'move'
    let drawTool: DrawTool = penTool
    if (penErase) mode = 'erase'
    else if (isPen) {
      mode = tool === 'erase' ? 'erase' : 'draw'
      drawTool = tool === 'move' || tool === 'erase' ? penTool : tool
    } else if (fingerWithPen) mode = 'move'
    else if (tool === 'erase') mode = 'erase'
    else if (tool !== 'move') { mode = 'draw'; drawTool = tool }

    pointer.current = e.pointerId
    if (isPen) penDown.current = true
    try { svg.current?.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
    past.current.push(board)
    future.current = []

    if (mode === 'move') {
      const t = board.tokens.find((x) => x.id === tokenId)
      setSelected(t ? t.id : null)
      action.current = t ? { kind: 'move', id: t.id, dx: t.x - p[0], dy: t.y - p[1] } : { kind: 'none' }
      if (!t) past.current.pop()
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
      setBoard((b) => ({ ...b, tokens: b.tokens.map((t) => (t.id === a.id ? { ...t, x: nx, y: ny } : t)) }))
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
    if (a.kind === 'move') {
      const before = past.current[past.current.length - 1]?.tokens.find((t) => t.id === a.id)
      const now = board.tokens.find((t) => t.id === a.id)
      if (before && now && before.x === now.x && before.y === now.y) past.current.pop()
    } else if (a.kind === 'draw') {
      setLive(null)
      const p = a.drawing.points
      const [x0, y0] = p[0], [x1, y1] = p[p.length - 1]
      const ok = a.drawing.type === 'zone' ? Math.abs(x1 - x0) > 1 && Math.abs(y1 - y0) > 1 : p.length > 1 && Math.hypot(x1 - x0, y1 - y0) > 1
      if (ok) setBoard((b) => ({ ...b, drawings: [...b.drawings, a.drawing] }))
      else past.current.pop()
    }
    force((x) => x + 1)
  }

  const addToken = (kind: 'home' | 'away' | 'ball' | 'cone') => {
    const jitter = () => (Math.random() - 0.5) * 4
    const cx = W / 2 + jitter(), cy = H / 2 + jitter()
    let t: Token
    if (kind === 'ball') t = ballAt(cx, cy)
    else if (kind === 'cone') t = coneAt(cx, cy)
    else {
      const used = new Set(board.tokens.filter((x) => x.team === kind).map((x) => x.label))
      let n = 1
      while (used.has(String(n))) n++
      t = player(kind, String(n), cx, cy)
    }
    commit((b) => ({ ...b, tokens: [...b.tokens, t] }))
    setSelected(t.id)
    setTool('move')
  }

  const setPitch = (pitch: PitchKind) => {
    if (pitch === board.pitch) return
    commit(emptyBoard(pitch))
    setSelected(null)
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
    setToast(res === 'shared' ? 'Imagen compartida' : res === 'saved' ? 'Imagen descargada' : 'No se pudo exportar la imagen en este navegador')
  }

  const vb = vertical
    ? `${-PAD} ${-PAD} ${H + 2 * PAD} ${W + 2 * PAD}`
    : `${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`
  const activeDraw = tool === 'move' || tool === 'erase' ? penTool : tool

  return (
    <div className="app">
      <header className="top">
        <strong className="brand">Pizarra</strong>
        <div className="seg" role="group" aria-label="Tipo de campo">
          {(Object.keys(PITCH) as PitchKind[]).map((k) => (
            <button key={k} className={board.pitch === k ? 'on' : ''} onClick={() => setPitch(k)}>
              {k === 'full' ? 'Campo' : k === 'half' ? 'Medio' : '40×30'}
            </button>
          ))}
        </div>
        <button onClick={() => setSheet('templates')}>Plantillas</button>
        <span className="sep" />
        <button className="chip home" onClick={() => addToken('home')} aria-label="Añadir jugador local">+ Local</button>
        <button className="chip away" onClick={() => addToken('away')} aria-label="Añadir jugador rival">+ Rival</button>
        <button onClick={() => addToken('ball')}>+ Balón</button>
        <button onClick={() => addToken('cone')}>+ Cono</button>
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
            <Pitch kind={board.pitch} />
            {board.drawings.map((d) => <DrawingShape key={d.id} d={d} />)}
            {live && <DrawingShape d={live} />}
            {board.tokens.map((t) => (
              <TokenShape key={t.id} t={t} r={r} selected={t.id === selected} upright={vertical} />
            ))}
          </g>
        </svg>
        {showHint && (
          <div className="hint" role="note">
            <p><b>S Pen:</b> el lápiz dibuja y el dedo mueve fichas. Mantén el botón lateral del lápiz para borrar.</p>
            <p><b>Sin lápiz:</b> elige abajo Mover o una herramienta de dibujo.</p>
            <button onClick={() => { setShowHint(false); try { localStorage.setItem('pizarra.ayuda', '1') } catch { /* sin almacenamiento */ } }}>Entendido</button>
          </div>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
      </main>

      {sel && (
        <div className="selbar">
          <span className="muted">{sel.kind === 'player' ? 'Jugador' : sel.kind === 'ball' ? 'Balón' : 'Cono'}</span>
          {sel.kind === 'player' && (
            <>
              <label className="field">
                Dorsal
                <input id="dorsal" value={sel.label} maxLength={3} inputMode="text" onChange={(e) => updateSel({ label: e.target.value.toUpperCase() })} />
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
          <button className="danger" onClick={removeSelected}>Eliminar</button>
        </div>
      )}

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
        <button onClick={() => commit((b) => ({ ...b, drawings: [] }))} disabled={!board.drawings.length}>Borrar trazos</button>
        {penSeen && <span className="pen">S Pen activo · lápiz: {TOOL_NAME[activeDraw]}</span>}
      </footer>

      {sheet === 'templates' && (
        <Sheet title="Plantillas" onClose={() => setSheet(null)}>
          {(['Sistemas', 'ABP', 'Ejercicios'] as const).map((g) => (
            <section key={g}>
              <h3>{g === 'ABP' ? 'Acciones a balón parado' : g}</h3>
              <div className="list">
                {TEMPLATES.filter((t) => t.group === g).map((t) => (
                  <button key={t.id} className="row" onClick={() => { commit(t.build()); setSelected(null); setSheet(null) }}>
                    {t.name}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </Sheet>
      )}
      {sheet === 'plays' && <PlaysSheet board={board} onOpen={(b) => { commit(b); setSheet(null) }} onClose={() => setSheet(null)} onSaved={() => setToast('Jugada guardada')} />}
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
      <p className="muted small">Las jugadas se guardan en este dispositivo.</p>
      <div className="list">
        {plays.length === 0 && <p className="muted">Todavía no hay jugadas guardadas.</p>}
        {plays.map((p) => (
          <div key={p.id} className="row play">
            <div>
              <b>{p.name}</b>
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
