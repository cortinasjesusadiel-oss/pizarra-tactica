import { DEFAULT_LOOK, PITCH, posAt, type Board, type Drawing, type Look, type Pt } from './model'
import { ballAir, drawParts, sampleAt } from './motion'
import { Pitch } from './Pitch'
import type { Mark } from './identity'
import { DrawingShape, TokenShape } from './Shapes'
import { clipStep, clipView, type ClipView, type Focus } from './clip'
import { PRO } from './pro'

// Lo que se dibuja dentro del campo en el instante `s` (puede ser fraccionario): césped, trazos y fichas.
// Se usa en la pizarra y al exportar el vídeo, para que ambos se vean igual.
// En una jugada grabada (`board.clip`), `s` son segundos; `view` es lo que se ve mientras se graba.
export function Scene({ board, s, zones, brand, ident, look, upright = false, selected = null, live = null, grass = true, ghost = false, view, focus = null }: {
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
  focus?: Focus | null
}) {
  const { r, w: PW, h: PH } = PITCH[board.pitch]
  const bounds: [number, number] = [PW, PH]
  const cv = view ?? (board.clip ? clipView(board, s) : null)
  // Jugada de pasos vista en tiempo real: se ven las flechas del paso en curso, que se recogen a medida que avanza.
  const cs = !view && board.clip?.marks && board.frames ? clipStep(board.clip, s) : null
  const stepDraw = cs ? (board.frames![cs.i]?.drawings ?? []).filter((d) => d.type !== 'text').map((d) => ({ d, part: [d.type === 'pass' || d.type === 'lob' ? cs.u : cs.u * cs.u * (3 - 2 * cs.u), 1] as [number, number] })) : []
  if (cv) return (
    <>
      {grass && <Pitch kind={board.pitch} zones={zones} brand={brand} ident={ident} />}
      {board.drawings.filter((d) => d.type !== 'text').map((d) => <DrawingShape key={d.id} d={d} />)}
      {stepDraw.map(({ d, part }) => <DrawingShape key={d.id} d={d} part={part} />)}
      {live && <DrawingShape d={live} />}
      {focus && <rect x={-6} y={-6} width={PW + 12} height={PH + 12} fill="#000" fillOpacity={0.45 * fade(focus.a)} pointerEvents="none" />}
      {cv.holder && cv.pos[cv.holder] && <circle cx={cv.pos[cv.holder][0]} cy={cv.pos[cv.holder][1]} r={r * 1.32} fill="none" stroke="#ffffff" strokeWidth={r * 0.1} strokeOpacity={0.55} pointerEvents="none" />}
      {depth(board.tokens, (t) => cv.pos[t.id] ?? [t.x, t.y], upright, look).map((t) => {
        const [x, y] = cv.pos[t.id] ?? [t.x, t.y]
        return <TokenShape key={t.id} t={{ ...t, x, y }} r={r} selected={t.id === selected} upright={upright} look={look} face={t.kind === 'player' ? cv.face[t.id] : undefined} gait={t.kind === 'player' ? gaitOf(t.id, s, cv.moving[t.id] ?? 0) : undefined} />
      })}
      {focus && <KeyMoment board={board} cv={cv} focus={focus} />}
      {board.drawings.filter((d) => d.type === 'text').map((d) => <DrawingShape key={d.id} d={d} upright={upright} bounds={bounds} />)}
    </>
  )
  const parts = drawParts(board, s)
  const fs = PRO && (board.frames?.length ?? 0) > 1 ? facesAt(board, s) : null
  const faces = fs?.face ?? null
  return (
    <>
      {grass && <Pitch kind={board.pitch} zones={zones} brand={brand} ident={ident} />}
      {board.drawings.filter((d) => d.type !== 'text').map((d) => <DrawingShape key={d.id} d={d} />)}
      {ghost && <Ghost board={board} step={Math.round(s)} upright={upright} look={look} />}
      {parts.filter(({ d }) => d.type !== 'text').map(({ d, part }) => <DrawingShape key={d.id} d={d} part={part} />)}
      {live && <DrawingShape d={live} />}
      <Motion board={board} s={s} look={look} />
      {depth(board.tokens, (t) => sampleAt(board, t, s), upright, look).map((t) => {
        const [x, y] = sampleAt(board, t, s)
        // Balón por el aire: su sombra va por el suelo y el balón se ve más grande cuanto más alto va.
        const air = ballAir(board, t, s)
        if (air) return (
          <g key={t.id}>
            <ellipse cx={air.shadow[0]} cy={air.shadow[1]} rx={r * 0.55 * (1 - air.lift * 0.3)} ry={r * 0.38 * (1 - air.lift * 0.3)} fill="#000" fillOpacity={0.5 - air.lift * 0.15} />
            <TokenShape t={{ ...t, x, y }} r={r * (1 + air.lift * 0.7)} selected={t.id === selected} upright={upright} look={look} />
          </g>
        )
        return <TokenShape key={t.id} t={{ ...t, x, y }} r={r} selected={t.id === selected} upright={upright} look={look} face={faces?.[t.id]} gait={fs && t.kind === 'player' ? gaitOf(t.id, s * STEP_RUN, fs.speed[t.id] ?? 0) : undefined} />
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
// Zancada: unas 1,7 zancadas por segundo, con un desfase distinto para cada jugador (no corren todos al compás).
// Cuanto más rápido, más se abren piernas y brazos.
function gaitOf(id: string, sec: number, speed: number) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return { phase: sec * Math.PI * 2 * 1.7 + (h % 628) / 100, amp: Math.max(0, Math.min(1, (speed - 0.4) / 6)) }
}
// En la animación por pasos, un paso de movimiento dura alrededor de 1,6 s.
const STEP_RUN = 1.6

function facesAt(board: Board, s: number): { face: Record<string, number>; speed: Record<string, number> } {
  const out: Record<string, number> = {}
  const speed: Record<string, number> = {}
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
    speed[t.id] = sp / STEP_RUN
  }
  return { face: out, speed }
}

// Con jugadores de pie, el que está más abajo en la pantalla se dibuja delante (como en una foto).
// El material va siempre debajo y el balón siempre encima, para no perderlo de vista.
function depth<T extends { kind: string }>(list: T[], at: (t: T) => Pt, upright: boolean, look?: Look): T[] {
  if (look?.shape !== 'player') return list
  const key = (t: T) => { const p = at(t); return upright ? p[0] : p[1] }
  const ground = list.filter((t) => t.kind !== 'player' && t.kind !== 'ball')
  const up = list.filter((t) => t.kind === 'player').map((t) => ({ t, k: key(t) })).sort((a, b) => a.k - b.k).map((x) => x.t)
  return [...ground, ...up, ...list.filter((t) => t.kind === 'ball')]
}

const fade = (a: number) => Math.max(0, Math.min(1, a * 5, (1 - a) * 5))

// Momento clave: la jugada se congela, el campo se oscurece y se resaltan el que pasa, el que recibe y el pase.
function KeyMoment({ board, cv, focus }: { board: Board; cv: ClipView; focus: Focus }) {
  const c = board.clip!
  const { r } = PITCH[board.pitch]
  const p = c.passes.find((x) => x.t >= focus.k - 0.01 && x.t <= focus.k + 1.2)
  const from = cv.holder ? cv.pos[cv.holder] : null
  const al = fade(focus.a)
  const G = '#4FD18B'
  const to: Pt | undefined = p ? (p.to ? clipView(board, Math.min(c.dur, p.t + 0.7)).pos[p.to] : p.at) : undefined
  // Sin pase cerca (una pausa puesta a mano): solo se resalta al que lleva el balón.
  if (!p || !to) return from ? <circle cx={from[0]} cy={from[1]} r={r * 2.1} fill={G} fillOpacity={0.14} stroke={G} strokeWidth={r * 0.2} opacity={al} pointerEvents="none" /> : null
  if (!from) return null
  const g = Math.min(1, focus.a * 2.4), e = g * g * (3 - 2 * g)
  const pulse = 1 + 0.12 * Math.sin(focus.a * Math.PI * 6)
  const dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy) || 1
  const ux = dx / L, uy = dy / L
  const sx = from[0] + ux * r * 1.6, sy = from[1] + uy * r * 1.6
  const end = Math.max(0, L - r * (p.to ? 3 : 1.2) - r * 1.6)
  const ex = sx + ux * end * e, ey = sy + uy * end * e
  const hw = r * 0.75
  const head = `M${ex + ux * hw * 1.4} ${ey + uy * hw * 1.4} L${ex - uy * hw} ${ey + ux * hw} L${ex + uy * hw} ${ey - ux * hw} Z`
  return (
    <g opacity={al} pointerEvents="none" style={{ pointerEvents: 'none' }}>
      <circle cx={from[0]} cy={from[1]} r={r * 2.1 * pulse} fill={G} fillOpacity={0.14} stroke={G} strokeWidth={r * 0.2} />
      {p.to && <circle cx={to[0]} cy={to[1]} r={r * 2.1 * (2 - pulse)} fill="#fff" fillOpacity={0.1} stroke="#fff" strokeWidth={r * 0.16} strokeDasharray={`${r * 0.6} ${r * 0.4}`} />}
      {!p.to && <circle cx={to[0]} cy={to[1]} r={r * 1.2} fill="none" stroke="#fff" strokeWidth={r * 0.16} />}
      {end > 0.2 && (
        <>
          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={G} strokeWidth={r * 0.75} strokeOpacity={0.25} strokeLinecap="round" />
          <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#fff" strokeWidth={r * 0.28} strokeLinecap="round" />
          <path d={head} fill="#fff" />
        </>
      )}
    </g>
  )
}
