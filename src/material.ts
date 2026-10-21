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

// Imagen que toca para un giro en pantalla (grados en el sentido del reloj) y lo que hay que girarla
// para llegar al ángulo exacto (en pantalla, en el sentido del reloj).
export function artKey(kind: Token['kind'], screenRot: number): { key: string; rest: number } | null {
  const y = YAWS[kind]
  if (!y) return null
  const { ys, period } = y
  const want = (((360 - screenRot) % period) + period) % period
  let best = ys[0], bd = 999, sd = 0
  for (const v of ys) {
    let d = want - v
    d = ((d % period) + period * 1.5) % period - period / 2
    if (Math.abs(d) < bd) { bd = Math.abs(d); best = v; sd = d }
  }
  // El giro de la imagen va al revés que el del objeto en 3D (la cámara mira desde abajo).
  return { key: `${kind}_${best}`, rest: y.turn ? -sd : 0 }
}

// Tamaño aproximado del objeto en la pizarra, para la zona donde se puede tocar y el círculo de selección.
export function equipmentRadius(kind: Token['kind'], r: number, scale = 1): number {
  const k = (kind === 'goal' ? 1 : Math.max(1, r / 1.1)) * scale
  return ((SHOW[kind] ?? 2) * k) / 2.6
}
