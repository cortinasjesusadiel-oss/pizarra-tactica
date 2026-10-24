import { lobAt, posAt, type Board, type Drawing, type Pt, type Token } from './model'
import { t } from '../i18n'

// Posición continua de una ficha en el instante `s`, medido en pasos (1.5 = a mitad entre el paso 1 y el 2).
// Los jugadores siguen una curva suave que pasa por todos los pasos (sin cambios bruscos de dirección):
// arrancan y frenan con suavidad cuando estaban o van a quedarse quietos, y no frenan entre pasos si siguen corriendo.
// El balón va en línea recta y a velocidad constante, como un pase.
export function sampleAt(b: Board, t: Token, s: number): Pt {
  const n = b.frames?.length ?? 0
  if (n < 2) return posAt(b, t, 0)
  const c = Math.max(0, Math.min(n - 1, s))
  const i = Math.min(Math.floor(c), n - 2)
  const u = c - i
  const p1 = posAt(b, t, i), p2 = posAt(b, t, i + 1)
  if (p1[0] === p2[0] && p1[1] === p2[1]) return p1
  if (t.kind === 'ball') {
    const lob = lobFor(b, i, p1, p2)
    return lob ? lobAt(p1, p2, u, lob.bend) : [p1[0] + (p2[0] - p1[0]) * u, p1[1] + (p2[1] - p1[1]) * u]
  }
  const p0 = i > 0 ? posAt(b, t, i - 1) : p1
  const p3 = i + 2 < n ? posAt(b, t, i + 2) : p2
  const still = (a: Pt, z: Pt) => a[0] === z[0] && a[1] === z[1]
  // Tangentes: cero si viene parado o se va a parar; si no, la dirección media (Catmull-Rom).
  const m1: Pt = still(p0, p1) ? [0, 0] : [(p2[0] - p0[0]) * 0.5, (p2[1] - p0[1]) * 0.5]
  const m2: Pt = still(p2, p3) ? [0, 0] : [(p3[0] - p1[0]) * 0.5, (p3[1] - p1[1]) * 0.5]
  const u2 = u * u, u3 = u2 * u
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2
  return [
    h00 * p1[0] + h10 * m1[0] + h01 * p2[0] + h11 * m2[0],
    h00 * p1[1] + h10 * m1[1] + h01 * p2[1] + h11 * m2[1],
  ]
}

// Si el balón sale y llega donde empieza y acaba un pase aéreo del paso `i`, ese pase (salida y llegada del balón).
function lobFor(b: Board, i: number, p1: Pt, p2: Pt): Drawing | null {
  const near = (a: Pt, z: Pt) => Math.hypot(a[0] - z[0], a[1] - z[1]) < 4
  const d = b.frames?.[i]?.drawings.find((x) => x.type === 'lob' && near(x.points[0], p1) && near(x.points[x.points.length - 1], p2))
  return d ?? null
}

// Altura del balón (0 en el suelo, 1 en lo más alto) y su sombra en el suelo, cuando va por el aire.
export function ballAir(b: Board, t: Token, s: number): { lift: number; shadow: Pt } | null {
  const n = b.frames?.length ?? 0
  if (t.kind !== 'ball' || n < 2) return null
  const c = Math.max(0, Math.min(n - 1, s))
  const i = Math.min(Math.floor(c), n - 2), u = c - i
  if (u <= 0 || u >= 1) return null
  const p1 = posAt(b, t, i), p2 = posAt(b, t, i + 1)
  const lob = lobFor(b, i, p1, p2)
  if (!lob) return null
  const lift = Math.sin(Math.PI * u)
  // Por el centro el balón va recto y su sombra se separa un poco al subir; curvado, la sombra va recta por el suelo.
  const sh = lob.bend === 0 ? lift * Math.min(1.6, Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 0.05) : 0
  return { lift, shadow: [p1[0] + (p2[0] - p1[0]) * u + sh * 0.6, p1[1] + (p2[1] - p1[1]) * u + sh] }
}

const smoothstep = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c) }

export const positionsAt = (b: Board, s: number): Record<string, Pt> =>
  Object.fromEntries(b.tokens.map((t) => [t.id, sampleAt(b, t, s)]))

// Ritmo de la reproducción y del vídeo: cuántos segundos dura cada paso en total y con qué velocidad se mueven
// las fichas. El resto del paso las fichas están quietas, para leer la explicación y ver las flechas.
export type Pace = { step: number; speed: Speed }
export type Speed = 'lenta' | 'normal' | 'rapida'
export const STEP_SECONDS = [3, 5, 8, 10]
export const SPEEDS: { id: Speed; name: string; move: number }[] = [
  { id: 'lenta', name: t('Lenta'), move: 2.6 },
  { id: 'normal', name: t('Normal'), move: 1.6 },
  { id: 'rapida', name: t('Rápida'), move: 0.9 },
]
export const DEFAULT_PACE: Pace = { step: 5, speed: 'normal' }

// Duración total de la animación en segundos: cada paso dura lo elegido, también el último.
export const paceTotal = (n: number, p: Pace) => Math.max(1, n) * p.step

// Instante `s` (en pasos) a los `t` segundos de empezar: primero las fichas quietas en el paso, luego el
// movimiento hacia el siguiente, que arranca y frena con suavidad.
export function paceAt(n: number, p: Pace, t: number): number {
  if (n < 2) return 0
  const move = Math.min(SPEEDS.find((x) => x.id === p.speed)?.move ?? 1.6, p.step - 1)
  const hold = p.step - move
  const i = Math.floor(t / p.step)
  if (i >= n - 1) return n - 1
  const r = t - i * p.step
  return r < hold ? i : i + smoothstep((r - hold) / move)
}

// Paso cuya explicación se muestra en el instante `s`: la del paso de salida durante casi todo el movimiento y,
// al llegar, la del paso siguiente. `fade` (0 a 1) funde la nueva sobre la anterior para que no haya corte.
export const caption = (b: Board, s: number): { k: number; prev: number; fade: number } => {
  const n = b.frames?.length ?? 0
  if (!n) return { k: 0, prev: 0, fade: 1 }
  const c = Math.max(0, Math.min(n - 1, s))
  const i = Math.floor(c + 1e-6), u = c - i
  if (u < 0.75 || i >= n - 1) return { k: i, prev: i, fade: 1 }
  return { k: i + 1, prev: i, fade: (u - 0.75) / 0.25 }
}
export const shownStep = (b: Board, s: number) => caption(b, s).k

// Flechas que se ven en el instante `s`: las del paso del que se sale, porque dibujan el movimiento que está ocurriendo.
export const drawStep = (b: Board, s: number) => {
  const n = b.frames?.length ?? 0
  return n ? Math.max(0, Math.min(n - 1, Math.floor(s + 1e-6))) : 0
}

// Flechas que se ven en el instante `s` y qué tramo de cada una. Parado en un paso, se ven enteras las de ese paso.
// Entre dos pasos, las flechas del paso que se deja se borran por detrás al ritmo del movimiento (el pase al ritmo
// del balón) y, al final del tramo, las del paso siguiente se van dibujando. Así el vídeo no da saltos.
export function drawParts(b: Board, s: number): { d: Drawing; part: [number, number] }[] {
  const f = b.frames
  if (!f?.length) return []
  const i = drawStep(b, s)
  const u = s - i
  if (u < 1e-4 || i >= f.length - 1) return f[i].drawings.map((d) => ({ d, part: [0, 1] }))
  const out: { d: Drawing; part: [number, number] }[] = f[i].drawings.map((d) => ({ d, part: [d.type === 'pass' || d.type === 'lob' ? u : smoothstep(u), 1] }))
  const grow = smoothstep((u - 0.55) / 0.45)
  if (grow > 0) for (const d of f[i + 1].drawings) out.push({ d, part: [0, grow] })
  return out
}
