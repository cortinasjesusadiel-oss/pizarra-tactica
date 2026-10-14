import { posAt, type Board, type Pt, type Token } from './model'

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
  if (t.kind === 'ball') return [p1[0] + (p2[0] - p1[0]) * u, p1[1] + (p2[1] - p1[1]) * u]
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

export const positionsAt = (b: Board, s: number): Record<string, Pt> =>
  Object.fromEntries(b.tokens.map((t) => [t.id, sampleAt(b, t, s)]))

// Duración de cada tramo entre dos pasos, en milisegundos.
export const SEG_MS = 1700

// Paso cuya explicación y flechas se muestran en el instante `s`: mientras las fichas viajan hacia un paso,
// ya se ven las flechas de ese paso.
export const shownStep = (b: Board, s: number) => {
  const n = b.frames?.length ?? 0
  return n ? Math.max(0, Math.min(n - 1, Math.ceil(s - 1e-6))) : 0
}

// Flechas que se ven en el instante `s`: las del paso del que se sale, porque dibujan el movimiento que está ocurriendo.
export const drawStep = (b: Board, s: number) => {
  const n = b.frames?.length ?? 0
  return n ? Math.max(0, Math.min(n - 1, Math.floor(s + 1e-6))) : 0
}
