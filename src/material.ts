// Carga de las imágenes del material (van en un archivo aparte para que la pizarra arranque rápido).
import { useSyncExternalStore } from 'react'
import type { Token } from './model'

type Art = Record<string, { u: string; w: number; h: number; x: number; y: number }>
let art: Art | null = null
const subs = new Set<() => void>()
export const artReady: Promise<Art> = import('./materialArt').then((m) => {
  art = m.default
  subs.forEach((f) => f())
  return art
})
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
export const useArt = () => useSyncExternalStore(subscribe, () => art, () => art)

// Giros dibujados de cada objeto (cada 22,5°). Los simétricos tienen menos; entre dos giros dibujados
// la imagen más cercana se gira lo que falta, así el objeto se puede orientar en cualquier ángulo.
const E16 = Array.from({ length: 16 }, (_, i) => i * 22.5)
const E8 = Array.from({ length: 8 }, (_, i) => i * 22.5)
const YAWS: Partial<Record<Token['kind'], { ys: number[]; period: number; turn: boolean }>> = {
  cone: { ys: [0, 45], period: 90, turn: true },
  disc: { ys: [0], period: 360, turn: false }, pole: { ys: [0], period: 360, turn: false },
  flag: { ys: [0], period: 360, turn: false }, ring: { ys: [0], period: 360, turn: false },
  hurdle: { ys: E8, period: 180, turn: true }, ladder: { ys: E8, period: 180, turn: true },
  mannequin: { ys: E16, period: 360, turn: true }, wall: { ys: E16, period: 360, turn: true },
  rebounder: { ys: E16, period: 360, turn: true }, minigoal: { ys: E16, period: 360, turn: true },
  goal: { ys: E16, period: 360, turn: true },
}
// Tamaño con el que se ve cada objeto en la pizarra (metros, lado mayor del dibujo sin girar).
// Algo más grande que el real para que se distinga en el campo; la portería va a escala.
export const SHOW: Partial<Record<Token['kind'], number>> = {
  cone: 1.5, disc: 1.4, pole: 3.4, flag: 3.4, hurdle: 2.2, ring: 2, ladder: 6.2,
  mannequin: 3.4, wall: 4.8, rebounder: 2.8, minigoal: 3.4, goal: 9.4,
}

// Imágenes que tocan para un giro en pantalla (grados en el sentido del reloj): las dos dibujadas más
// cercanas, cada una girada lo que le falta y mezcladas según la cercanía. Así el giro es continuo, sin saltos.
export function artPicks(kind: Token['kind'], screenRot: number): { key: string; rest: number; alpha: number }[] {
  const y = YAWS[kind]
  if (!y) return []
  const { ys, period } = y
  if (ys.length === 1) return [{ key: `${kind}_${ys[0]}`, rest: 0, alpha: 1 }]
  const step = period / ys.length
  const want = (((360 - screenRot) % period) + period) % period
  const i = Math.floor(want / step + 1e-9) % ys.length
  const f = want / step - Math.floor(want / step + 1e-9)
  const lo = ys[i], hi = ys[(i + 1) % ys.length]
  // El giro de la imagen va al revés que el del objeto en 3D (la cámara mira desde abajo).
  const a = { key: `${kind}_${lo}`, rest: -f * step }, b = { key: `${kind}_${hi}`, rest: (1 - f) * step }
  // La más cercana va encima y entera; la otra debajo, más visible cuanto más cerca está el ángulo de ella.
  const [near, far] = f < 0.5 ? [a, b] : [b, a]
  const w = 2 * Math.min(f, 1 - f)
  const out = w > 0.03 ? [{ ...far, alpha: w }] : []
  out.push({ ...near, alpha: 1 })
  return out
}

// Tamaño aproximado del objeto en la pizarra, para la zona donde se puede tocar y el círculo de selección.
export function equipmentRadius(kind: Token['kind'], r: number, scale = 1): number {
  const k = (kind === 'goal' ? 1 : Math.max(1, r / 1.1)) * scale
  return ((SHOW[kind] ?? 2) * k) / 2.6
}
