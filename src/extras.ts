import type { ReactNode } from 'react'
import type { Template } from './contenido/anim'
import type { Board, Look } from './nucleo/model'
import type { Pace } from './nucleo/motion'
import type { SheetId } from './pantalla/barras'

// Enchufes para una versión con funciones extra.
// En esta versión (la web) están todos vacíos: no añaden nada y la pizarra funciona igual que sin ellos.
// Otra versión puede cambiar solo este archivo para conectar sus funciones, sin tocar el resto.

// Lo que la pizarra ofrece a los extras para leer y cambiar.
export type ContextoExtras = {
  board: Board
  commit: (next: Board | ((b: Board) => Board)) => void
  cur: number
  playing: boolean
  stopAnim: () => void
  look: Look
  setLook: (patch: Partial<Look>) => void
  pace: Pace
  setPace: (patch: Partial<Pace>) => void
  exporting: boolean
  setSheet: (s: SheetId) => void
  avisar: (msg: string) => void
}

// Puntero desviado a otra función (por ejemplo, mientras se graba algo).
export type Desvio = { down: (e: React.PointerEvent) => void; move: (e: React.PointerEvent) => void; up: (e: React.PointerEvent) => void }

export type Extras = {
  // Barra de arriba: algo junto al nombre, opciones al final de «Vista» y otro nombre para el botón de fichas.
  marca?: ReactNode
  vista?: (cerrar: () => void) => ReactNode
  nombreFichas?: string
  // Barra de pasos: otra barra en su lugar, botones tras «Quitar paso» o tras «+ Paso» (sin pasos) y el ritmo de cada paso.
  barraPasos?: ReactNode
  trasPasos?: ReactNode
  sinPasos?: ReactNode
  ritmo?: { valor: number; elegir: (v: number) => void; opciones: ReactNode }
  // Campo: desviar el puntero o impedir mover una ficha (devuelve true para no moverla).
  desvio?: Desvio | null
  noMover?: (tokenId: string) => boolean
  // Hoja de fichas: otro título, formas añadidas delante y una sección extra.
  fichas?: { titulo?: string; formas?: { id: string; nombre: string }[]; extra?: ReactNode }
  // Hoja de exportar: una sección extra tras «Esta pizarra».
  exportar?: ReactNode
  // Pantalla de bienvenida al abrir.
  bienvenida?: ReactNode
}

export function useExtras(c: ContextoExtras): Extras {
  void c
  return {}
}

// Fichas al abrir la pizarra: sin enchufe se leen las guardadas.
export const leerFichasExtra: (() => Look) | undefined = undefined

// Plantillas añadidas al final de la biblioteca.
export const PLANTILLAS_EXTRA: Template[] = []
