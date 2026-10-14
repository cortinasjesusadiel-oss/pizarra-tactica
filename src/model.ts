// Todas las coordenadas están en metros, con el equipo local atacando hacia la derecha (+x).

export type PitchKind = 'full' | 'half' | 'grid'
export type Team = 'home' | 'away' | 'neutral'
export type TokenKind = 'player' | 'ball' | 'cone'
export type DrawTool = 'pass' | 'run' | 'dribble' | 'zone' | 'free'
export type Tool = 'move' | DrawTool | 'erase'
export type Pt = [number, number]

export interface Token {
  id: string
  kind: TokenKind
  team: Team
  label: string
  x: number
  y: number
}

export interface Drawing {
  id: string
  type: DrawTool
  color: string
  width: number
  points: Pt[]
}

export interface Board {
  pitch: PitchKind
  tokens: Token[]
  drawings: Drawing[]
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
  free: '#ff6b5e',
}

export const TOOL_NAME: Record<Tool, string> = {
  move: 'Mover',
  pass: 'Pase',
  run: 'Carrera',
  dribble: 'Conducción',
  zone: 'Zona',
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
export const line = (type: DrawTool, points: Pt[]): Drawing => ({
  id: uid(), type, color: DEFAULT_COLOR[type], width: 0.4, points,
})
