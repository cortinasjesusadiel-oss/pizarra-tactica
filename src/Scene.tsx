import { DEFAULT_LOOK, PITCH, posAt, type Board, type Drawing, type Look, type Pt } from './model'
import { ballAir, drawParts, sampleAt } from './motion'
import { Pitch } from './Pitch'
import type { Mark } from './identity'
import { DrawingShape, TokenShape } from './Shapes'
import { clipView, type ClipView } from './clip'
import { PRO } from './pro'

// Lo que se dibuja dentro del campo en el instante `s` (puede ser fraccionario): césped, trazos y fichas.
// Se usa en la pizarra y al exportar el vídeo, para que ambos se vean igual.
// En una jugada grabada (`board.clip`), `s` son segundos; `view` es lo que se ve mientras se graba.
export function Scene({ board, s, zones, brand, ident, look, upright = false, selected = null, live = null, grass = true, ghost = false, view }: {
  board: Board
  brand?: string
  ident?: Mark | null
  look?: Look
  s: number
  zones?: boolean
  upright?: boolean
  selected?: string | null
  live?: Drawing | null
  grass?: boolean
  ghost?: boolean
  view?: ClipView | null
}) {
  const { r, w: PW, h: PH } = PITCH[board.pitch]
  const bounds: [number, number] = [PW, PH]
  const cv = view ?? (board.clip ? clipView(board, s) : null)
  if (cv) return (
    <>
      {grass && <Pitch kind={board.pitch} zones={zones} brand={brand} ident={ident} />}
      {board.drawings.filter((d) => d.type !== 'text').map((d) => <DrawingShape key={d.id} d={d} />)}
      {live && <DrawingShape d={live} />}
      {cv.holder && cv.pos[cv.holder] && <circle cx={cv.pos[cv.holder][0]} cy={cv.pos[cv.holder][1]} r={r * 1.32} fill="none" stroke="#ffffff" strokeWidth={r * 0.1} strokeOpacity={0.55} pointerEvents="none" />}
      {board.tokens.map((t) => {
        const [x, y] = cv.pos[t.id] ?? [t.x, t.y]
        return <TokenShape key={t.id} t={{ ...t, x, y }} r={r} selected={t.id === selected} upright={upright} look={look} face={t.kind === 'player' ? cv.face[t.id] : undefined} />
      })}
      {board.drawings.filter((d) => d.type === 'text').map((d) => <DrawingShape key={d.id} d={d} upright={upright} bounds={bounds} />)}
    </>
  )
  const parts = drawParts(board, s)
  const faces = PRO && (board.frames?.length ?? 0) > 1 ? facesAt(board, s) : null
  return (
    <>
      {grass && <Pitch kind={board.pitch} zones={zones} brand={brand} ident={ident} />}
      {board.drawings.filter((d) => d.type !== 'text').map((d) => <DrawingShape key={d.id} d={d} />)}
      {ghost && <Ghost board={board} step={Math.round(s)} upright={upright} look={look} />}
      {parts.filter(({ d }) => d.type !== 'text').map(({ d, part }) => <DrawingShape key={d.id} d={d} part={part} />)}
      {live && <DrawingShape d={live} />}
      <Motion board={board} s={s} look={look} />
      {board.tokens.map((t) => {
        const [x, y] = sampleAt(board, t, s)
        // Balón por el aire: su sombra va por el suelo y el balón se ve más grande cuanto más alto va.
        const air = ballAir(board, t, s)
        if (air) return (
          <g key={t.id}>
            <ellipse cx={air.shadow[0]} cy={air.shadow[1]} rx={r * 0.55 * (1 - air.lift * 0.3)} ry={r * 0.38 * (1 - air.lift * 0.3)} fill="#000" fillOpacity={0.5 - air.lift * 0.15} />
            <TokenShape t={{ ...t, x, y }} r={r * (1 + air.lift * 0.7)} selected={t.id === selected} upright={upright} look={look} />
          </g>
        )
        return <TokenShape key={t.id} t={{ ...t, x, y }} r={r} selected={t.id === selected} upright={upright} look={look} face={faces?.[t.id]} />
      })}
      {/* Los letreros van encima de todo para que siempre se lean. */}
      {board.drawings.filter((d) => d.type === 'text').map((d) => <DrawingShape key={d.id} d={d} upright={upright} bounds={bounds} />)}
      {parts.filter(({ d }) => d.type === 'text').map(({ d, part }) => <DrawingShape key={d.id} d={d} part={part} upright={upright} bounds={bounds} />)}
    </>
  )
}

// Mientras editas un paso, se ve en transparente dónde estaba cada ficha en el paso anterior,
// con una línea fina hasta su sitio actual. No se puede tocar ni sale en el vídeo.
function Ghost({ board, step, upright, look }: { board: Board; step: number; upright: boolean; look?: Look }) {
  if (!board.frames || step < 1) return null
  const { r } = PITCH[board.pitch]
  return (
    <g pointerEvents="none" style={{ pointerEvents: 'none' }}>
      {board.tokens.map((t) => {
        const [x0, y0] = posAt(board, t, step - 1), [x1, y1] = posAt(board, t, step)
        if (Math.hypot(x1 - x0, y1 - y0) < 0.3) return null
        return (
          <g key={t.id}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#fff" strokeOpacity={0.45} strokeWidth={0.18} strokeDasharray="0.5 0.45" />
            <g opacity={0.32}><TokenShape t={{ ...t, id: `ghost-${t.id}`, x: x0, y: y0 }} r={r} selected={false} upright={upright} look={look} /></g>
          </g>
        )
      })}
    </g>
  )
}

// Para que se vea al instante quién se mueve y hacia dónde: mientras una ficha viaja deja una estela de su
// color y lleva un halo que aparece al arrancar y se apaga al llegar. Además, el jugador que lleva el balón
// tiene un aro claro debajo.
function Motion({ board, s, look = DEFAULT_LOOK }: { board: Board; s: number; look?: Look }) {
  const n = board.frames?.length ?? 0
  if (n < 2) return null
  const { r } = PITCH[board.pitch]
  const c = Math.max(0, Math.min(n - 1, s))
  const i = Math.min(Math.floor(c), n - 2), u = c - i
  const now = Object.fromEntries(board.tokens.map((t) => [t.id, sampleAt(board, t, c)])) as Record<string, Pt>
  const ball = board.tokens.find((t) => t.kind === 'ball')
  let holder: string | null = null
  if (ball) {
    let bd = r * 1.3
    for (const t of board.tokens) {
      if (t.kind !== 'player') continue
      const d = Math.hypot(now[t.id][0] - now[ball.id][0], now[t.id][1] - now[ball.id][1])
      if (d < bd) { bd = d; holder = t.id }
    }
  }
  const moving = u > 1e-3 ? board.tokens.filter((t) => {
    if (t.kind !== 'player' && t.kind !== 'ball') return false
    const a = posAt(board, t, i), b = posAt(board, t, i + 1)
    return Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.3
  }) : []
  const glow = Math.sin(Math.PI * Math.min(1, u * 1.15))
  return (
    <g pointerEvents="none" style={{ pointerEvents: 'none' }}>
      {moving.map((t) => {
        const col = t.kind === 'ball' ? '#ffffff' : t.team === 'home' ? look.home : t.team === 'away' ? look.away : '#f4f4f4'
        const N = 14
        const pts = Array.from({ length: N + 1 }, (_, k) => sampleAt(board, t, i + (u * k) / N))
        const w = t.kind === 'ball' ? r * 0.22 : r * 0.5
        return (
          <g key={t.id}>
            {pts.slice(1).map((p, k) => (
              <line key={k} x1={pts[k][0]} y1={pts[k][1]} x2={p[0]} y2={p[1]} stroke={col} strokeWidth={w * (0.35 + (0.65 * (k + 1)) / N)}
                strokeOpacity={0.5 * ((k + 1) / N) * Math.min(1, glow * 1.6)} strokeLinecap="round" />
            ))}
            {t.kind === 'player' && (
              <circle cx={now[t.id][0]} cy={now[t.id][1]} r={r * 1.55} fill={col} fillOpacity={0.12 * glow} stroke={col} strokeWidth={r * 0.16} strokeOpacity={0.85 * glow} />
            )}
          </g>
        )
      })}
      {holder && <circle cx={now[holder][0]} cy={now[holder][1]} r={r * 1.32} fill="none" stroke="#ffffff" strokeWidth={r * 0.1} strokeOpacity={0.6} />}
    </g>
  )
}

// Hacia dónde mira cada jugador en una animación por pasos: hacia donde corre y, parado, hacia el balón.
function facesAt(board: Board, s: number): Record<string, number> {
  const out: Record<string, number> = {}
  const ball = board.tokens.find((t) => t.kind === 'ball')
  const bp = ball ? sampleAt(board, ball, s) : null
  const e = 0.03
  for (const t of board.tokens) {
    if (t.kind !== 'player') continue
    const a = sampleAt(board, t, s - e), z = sampleAt(board, t, s + e), p = sampleAt(board, t, s)
    const vx = (z[0] - a[0]) / (2 * e), vy = (z[1] - a[1]) / (2 * e), sp = Math.hypot(vx, vy)
    let tx = 0, ty = 0
    if (bp) { const d = Math.hypot(bp[0] - p[0], bp[1] - p[1]); if (d > 0.05) { tx = (bp[0] - p[0]) / d; ty = (bp[1] - p[1]) / d } }
    if (!tx && !ty) { tx = t.team === 'away' ? -1 : 1 }
    const w = Math.max(0, Math.min(1, (sp - 1) / 4)), k = w * w * (3 - 2 * w)
    const mx = sp > 1e-6 ? vx / sp : 0, my = sp > 1e-6 ? vy / sp : 0
    out[t.id] = Math.atan2(my * k + ty * (1 - k), mx * k + tx * (1 - k))
  }
  return out
}
