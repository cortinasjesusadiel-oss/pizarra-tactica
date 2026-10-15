// Todas las coordenadas están en metros, con el equipo local atacando hacia la derecha (+x).

export type PitchKind = 'full' | 'half' | 'grid'
export type Team = 'home' | 'away' | 'neutral'
export type TokenKind = 'player' | 'ball' | 'cone' | 'pole' | 'hurdle' | 'ring' | 'ladder' | 'minigoal' | 'goal' | 'mannequin' | 'flag'

// Material de entrenamiento que se puede poner en la pizarra.
export const EQUIPMENT: { kind: TokenKind; name: string }[] = [
  { kind: 'cone', name: 'Cono' },
  { kind: 'pole', name: 'Pica' },
  { kind: 'hurdle', name: 'Valla' },
  { kind: 'ring', name: 'Aro' },
  { kind: 'ladder', name: 'Escalera' },
  { kind: 'mannequin', name: 'Maniquí' },
  { kind: 'minigoal', name: 'Miniportería' },
  { kind: 'goal', name: 'Portería' },
  { kind: 'flag', name: 'Banderín' },
]
export const KIND_NAME = (k: TokenKind) => (k === 'player' ? 'Jugador' : k === 'ball' ? 'Balón' : EQUIPMENT.find((e) => e.kind === k)?.name ?? '')
export type DrawTool = 'pass' | 'run' | 'dribble' | 'zone' | 'focus' | 'free'
export type Tool = 'move' | DrawTool | 'erase'
export type Pt = [number, number]

export interface Token {
  id: string
  kind: TokenKind
  team: Team
  label: string
  // Nombre del jugador (opcional), se muestra debajo de la ficha.
  name?: string
  x: number
  y: number
  rot?: number
}

// Aspecto de las fichas, elegido por el usuario y común a todas las pizarras.
export type TokenShapeKind = 'disc' | 'pro' | 'shirt'
export type TokenText = 'number' | 'name' | 'both'
export interface Look { shape: TokenShapeKind; text: TokenText; home: string; away: string }
export const DEFAULT_LOOK: Look = { shape: 'pro', text: 'both', home: '#ffd23f', away: '#5bb6ff' }
export const TEAM_COLORS = ['#ffd23f', '#5bb6ff', '#ff6b5e', '#ffffff', '#1d1d1f', '#2ecc71', '#ff9f1c', '#9b59ff', '#e84393', '#14365d']

export interface Drawing {
  id: string
  type: DrawTool
  color: string
  width: number
  points: Pt[]
}

// Un paso de una animación: solo guarda las fichas que se mueven en ese paso
// y las flechas que explican lo que va a pasar a continuación.
export interface Frame {
  pos: Record<string, Pt>
  drawings: Drawing[]
  note: string
}

export interface Board {
  pitch: PitchKind
  tokens: Token[]
  drawings: Drawing[]
  frames?: Frame[]
}

// Posición de una ficha en el paso `step`: la última posición definida hasta ese paso.
export function posAt(b: Board, t: Token, step: number): Pt {
  const f = b.frames
  if (f) for (let i = Math.min(step, f.length - 1); i > 0; i--) if (f[i].pos[t.id]) return f[i].pos[t.id]
  return [t.x, t.y]
}

export const PITCH: Record<PitchKind, { w: number; h: number; name: string; r: number }> = {
  full: { w: 105, h: 68, name: 'Campo completo', r: 1.7 },
  half: { w: 52.5, h: 68, name: 'Medio campo', r: 1.5 },
  grid: { w: 40, h: 30, name: 'Espacio 40×30', r: 1.1 },
}

export const COLORS = ['#ffffff', '#ffd23f', '#ff6b5e', '#5bb6ff']

export const DEFAULT_COLOR: Record<DrawTool, string> = {
  pass: '#ffffff',
  run: '#ffd23f',
  dribble: '#ffffff',
  zone: '#ffd23f',
  focus: '#ffffff',
  free: '#ff6b5e',
}

export const TOOL_NAME: Record<Tool, string> = {
  move: 'Mover',
  pass: 'Pase',
  run: 'Carrera',
  dribble: 'Conducción',
  zone: 'Zona',
  focus: 'Foco',
  free: 'Libre',
  erase: 'Borrar',
}

let seq = 0
export const uid = () => `${Date.now().toString(36)}${(seq++).toString(36)}`

export const player = (team: Team, label: string, x: number, y: number): Token => ({
  id: uid(), kind: 'player', team, label, x, y,
})
export const ballAt = (x: number, y: number): Token => ({ id: uid(), kind: 'ball', team: 'neutral', label: '', x, y })
export const coneAt = (x: number, y: number): Token => ({ id: uid(), kind: 'cone', team: 'neutral', label: '', x, y })
export const item = (kind: TokenKind, x: number, y: number, rot = 0): Token => ({ id: uid(), kind, team: 'neutral', label: '', x, y, rot })
export const line = (type: DrawTool, points: Pt[]): Drawing => ({
  id: uid(), type, color: DEFAULT_COLOR[type], width: 0.4, points,
})
