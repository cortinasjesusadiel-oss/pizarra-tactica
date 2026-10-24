// Ayudas para crear animaciones sin tener que recolocar cada ficha a mano en cada paso.
import { MOVES_BALL, MOVES_PLAYER, PITCH, posAt, type Board, type Drawing, type Pt, type Token } from './model'

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])

// El jugador que lleva el balón en un paso: el más cercano al balón, si está pegado a él.
export function carrier(b: Board, step: number): Token | null {
  const ball = b.tokens.find((t) => t.kind === 'ball')
  if (!ball) return null
  const bp = posAt(b, ball, step)
  const { r } = PITCH[b.pitch]
  let best: Token | null = null, bd = r * 1.3
  for (const t of b.tokens) {
    if (t.kind !== 'player') continue
    const d = dist(posAt(b, t, step), bp)
    if (d < bd) { bd = d; best = t }
  }
  return best
}

// Sitio del balón cuando lo lleva un jugador: a sus pies, hacia el lado al que ataca, sin tapar su número.
const atFeet = (p: Pt, t: Token, r: number): Pt => [p[0] + r * 0.85 * (t.team === 'away' ? -1 : 1), p[1] + r * 0.42]

// Si el balón se suelta encima de un jugador, dónde dejarlo para que quede a sus pies (o null si no está encima de nadie).
export function ballToFeet(b: Board, step: number, ballId: string): Pt | null {
  const ball = b.tokens.find((t) => t.id === ballId && t.kind === 'ball')
  if (!ball) return null
  const bp = posAt(b, ball, step)
  const { r } = PITCH[b.pitch]
  let best: Token | null = null, bd = r * 0.75
  for (const t of b.tokens) {
    if (t.kind !== 'player') continue
    const d = dist(posAt(b, t, step), bp)
    if (d < bd) { bd = d; best = t }
  }
  return best ? atFeet(posAt(b, best, step), best, r) : null
}

// Plantillas y sesiones: en cada paso, si el balón está encima de un jugador, se deja a sus pies.
export function settleBall(b: Board): Board {
  const ball = b.tokens.find((t) => t.kind === 'ball')
  if (!ball || (b as { clip?: unknown }).clip) return b
  let out = b
  const steps = b.frames?.length ?? 1
  for (let i = 0; i < steps; i++) {
    const to = ballToFeet(out, i, ball.id)
    if (!to) continue
    out = i === 0
      ? { ...out, tokens: out.tokens.map((t) => (t.id === ball.id ? { ...t, x: to[0], y: to[1] } : t)) }
      : { ...out, frames: out.frames!.map((f, k) => (k === i ? { ...f, pos: { ...f.pos, [ball.id]: to } } : f)) }
  }
  return out
}

// Dónde queda cada ficha en el paso siguiente según las flechas dibujadas en este paso:
// carrera y conducción llevan al jugador que está al inicio de la flecha hasta su final
// (en la conducción, con el balón), y el pase lleva el balón hasta el final de la flecha.
export function movesFromArrows(b: Board, step: number, drawings: Drawing[]): Record<string, Pt> {
  const { r } = PITCH[b.pitch]
  const out: Record<string, Pt> = {}
  const used = new Set<string>()
  const ball = b.tokens.find((t) => t.kind === 'ball')
  const holder = carrier(b, step)
  const ordered = [...drawings].sort((x, y) => (MOVES_BALL.includes(x.type) ? 1 : 0) - (MOVES_BALL.includes(y.type) ? 1 : 0))
  for (const d of ordered) {
    if (d.points.length < 2) continue
    const start = d.points[0], end = d.points[d.points.length - 1]
    if (MOVES_PLAYER.includes(d.type)) {
      let best: Token | null = null, bd = r * 2.2
      for (const t of b.tokens) {
        if (t.kind !== 'player' || used.has(t.id)) continue
        const dd = dist(posAt(b, t, step), start)
        if (dd < bd) { bd = dd; best = t }
      }
      if (!best) continue
      used.add(best.id)
      out[best.id] = [end[0], end[1]]
      // Conducción: el balón va con él, delante, como estaba.
      if (d.type === 'dribble' && ball && holder?.id === best.id && !out[ball.id]) {
        const bp = posAt(b, ball, step), pp = posAt(b, best, step)
        out[ball.id] = [end[0] + (bp[0] - pp[0]), end[1] + (bp[1] - pp[1])]
      }
    } else if (MOVES_BALL.includes(d.type) && ball && !used.has(ball.id)) {
      if (dist(posAt(b, ball, step), start) > r * 2.2 && !(holder && dist(posAt(b, holder, step), start) < r * 2.2)) continue
      used.add(ball.id)
      // Si el pase acaba en un compañero, el balón queda a sus pies, no encima de la ficha.
      let to: Token | null = null, td = r * 2.2
      for (const t of b.tokens) {
        if (t.kind !== 'player') continue
        const dd = dist(out[t.id] ?? posAt(b, t, step), end)
        if (dd < td) { td = dd; to = t }
      }
      if (to) {
        out[ball.id] = atFeet(out[to.id] ?? posAt(b, to, step), to, r)
      } else out[ball.id] = [end[0], end[1]]
    }
  }
  return out
}
