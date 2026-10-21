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

// Giros dibujados de cada objeto (cada 45°). Los simétricos tienen menos.
const E8 = [0, 45, 90, 135, 180, 225, 270, 315]
const E4 = [0, 45, 90, 135]
const YAWS: Partial<Record<Token['kind'], number[]>> = {
  cone: [0, 45], disc: [0], pole: [0], flag: [0], ring: [0], hurdle: E4, ladder: E4,
  mannequin: E8, wall: E8, rebounder: E8, minigoal: E8, goal: E8,
}
// Tamaño con el que se ve cada objeto en la pizarra (metros, lado mayor del dibujo sin girar).
// Algo más grande que el real para que se distinga en el campo; la portería va a escala.
export const SHOW: Partial<Record<Token['kind'], number>> = {
  cone: 1.5, disc: 1.4, pole: 3.4, flag: 3.4, hurdle: 2.2, ring: 2, ladder: 6.2,
  mannequin: 3.4, wall: 4.8, rebounder: 2.8, minigoal: 3.4, goal: 9.4,
}

// Imagen que toca para un giro en pantalla (grados en el sentido del reloj).
export function artKey(kind: Token['kind'], screenRot: number): string | null {
  const ys = YAWS[kind]
  if (!ys) return null
  const period = ys === E4 ? 180 : kind === 'cone' ? 90 : 360
  const want = (((360 - screenRot) % period) + period) % period
  let best = ys[0], bd = 999
  for (const y of ys) {
    const d = Math.min(Math.abs(want - y), period - Math.abs(want - y))
    if (d < bd) { bd = d; best = y }
  }
  return `${kind}_${best}`
}

// Tamaño aproximado del objeto en la pizarra, para la zona donde se puede tocar y el círculo de selección.
export function equipmentRadius(kind: Token['kind'], r: number): number {
  const k = kind === 'goal' ? 1 : Math.max(1, r / 1.1)
  return ((SHOW[kind] ?? 2) * k) / 2.6
}
