import { line, type Board, type Drawing, type Frame, type Pt, type Token } from './model'

export const GROUPS = [
  { id: 'Fundamentos', name: 'Fundamentos' },
  { id: 'Sistemas', name: 'Sistemas' },
  { id: 'Bloques', name: 'Bloques defensivos' },
  { id: 'Presión alta', name: 'Presión alta' },
  { id: 'Transiciones', name: 'Transiciones (A-D y D-A)' },
  { id: 'Generar espacios', name: 'Generar espacios' },
  { id: 'ABP', name: 'Acciones a balón parado' },
  { id: 'Ejercicios', name: 'Ejercicios' },
] as const

export interface Template {
  id: string
  group: (typeof GROUPS)[number]['id']
  name: string
  animated?: boolean
  build: () => Board
}

// Ayuda para escribir animaciones: las fichas tienen nombre (`cast`) y cada paso dice a dónde se mueven.
// Las flechas de un paso (`draw`) dibujan lo que va a pasar justo después; la nota explica cómo está el juego en ese paso.
export interface Step { note: string; move?: Record<string, Pt>; draw?: Drawing[] }

export function animate(pitch: Board['pitch'], cast: Record<string, Token>, steps: Step[], extra: Token[] = []): Board {
  const frames: Frame[] = steps.map((s) => ({
    note: s.note,
    drawings: s.draw ?? [],
    pos: Object.fromEntries(Object.entries(s.move ?? {}).map(([k, p]) => [cast[k].id, p])),
  }))
  return { pitch, tokens: [...extra, ...Object.values(cast)], drawings: [], frames }
}

// Flecha roja discontinua: un jugador sale a presionar.
export const press = (p: Pt[]): Drawing => ({ ...line('run', p), color: '#ff6b5e' })
