import { t } from './i18n'
// Todas las coordenadas están en metros, con el equipo local atacando hacia la derecha (+x).

export type PitchKind = 'full' | 'half' | 'grid'
export type Team = 'home' | 'away' | 'neutral'
export type TokenKind = 'player' | 'ball' | 'cone' | 'disc' | 'pole' | 'hurdle' | 'ring' | 'ladder' | 'minigoal' | 'goal' | 'mannequin' | 'wall' | 'rebounder' | 'flag'

// Material de entrenamiento que se puede poner en la pizarra.
export const EQUIPMENT: { kind: TokenKind; name: string }[] = [
  { kind: 'disc', name: t('Platillo') },
  { kind: 'cone', name: t('Cono') },
  { kind: 'pole', name: t('Pica') },
  { kind: 'hurdle', name: t('Valla') },
  { kind: 'ring', name: t('Aro') },
  { kind: 'ladder', name: t('Escalera') },
  { kind: 'mannequin', name: t('Maniquí') },
  { kind: 'wall', name: t('Barrera') },
  { kind: 'rebounder', name: t('Rebotador') },
  { kind: 'minigoal', name: t('Miniportería') },
  { kind: 'goal', name: t('Portería') },
  { kind: 'flag', name: t('Banderín') },
]
export const KIND_NAME = (k: TokenKind) => (k === 'player' ? t('Jugador') : k === 'ball' ? t('Balón') : EQUIPMENT.find((e) => e.kind === k)?.name ?? '')
export type DrawTool = 'pass' | 'lob' | 'run' | 'arrow' | 'dribble' | 'press' | 'shot' | 'line' | 'dline' | 'darrow' | 'text' | 'zone' | 'focus' | 'free'
// Flechas que mueven a un jugador al crear un paso (con o sin balón).
// «Flecha», «Flecha punteada» y «Línea punteada» no mueven a nadie: son solo dibujos para explicar.
export const MOVES_PLAYER: DrawTool[] = ['run', 'dribble', 'press']
// Flechas que mueven el balón.
export const MOVES_BALL: DrawTool[] = ['pass', 'lob', 'shot']
// Trazos rectos: solo cuentan el inicio y el final.
export const STRAIGHT: DrawTool[] = ['pass', 'lob', 'shot', 'line', 'dline']
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
  // Solo el material: tamaño respecto al normal (1 = normal).
  size?: number
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
  // Solo en los letreros (tipo 'text'): lo que pone. Se coloca en points[0].
  text?: string
  // Letreros: color del fondo ('none' = sin fondo) y tamaño de la letra en metros del campo.
  bg?: string
  fs?: number
  // Solo en el pase aéreo: hacia qué lado se curva (en metros, con signo; 0 = recto por el centro).
  bend?: number
}

export const LABEL_DEFAULT_BG = '#0b1510'
export const LABEL_SIZES = [{ fs: 1.5, name: 'Pequeña' }, { fs: 2.1, name: 'Mediana' }, { fs: 3, name: 'Grande' }, { fs: 4.2, name: 'Muy grande' }]
export const LABEL_TEXT_COLORS = ['#ffffff', '#ffd23f', '#ff6b5e', '#5bb6ff', '#4fd18b', '#ff9f1c', '#1d1d1f']
export const LABEL_BG_COLORS = [LABEL_DEFAULT_BG, '#ffffff', '#ffd23f', '#ff6b5e', '#5bb6ff', '#00995e', '#1d1d1f', 'none']

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
  full: { w: 105, h: 68, name: t('Campo completo'), r: 1.7 },
  half: { w: 52.5, h: 68, name: t('Medio campo'), r: 1.5 },
  grid: { w: 40, h: 30, name: t('Espacio 40×30'), r: 1.1 },
}

export const COLORS = ['#ffffff', '#ffd23f', '#ff6b5e', '#5bb6ff']

export const DEFAULT_COLOR: Record<DrawTool, string> = {
  pass: '#ffffff',
  lob: '#ffffff',
  run: '#ffd23f',
  arrow: '#ffffff',
  dribble: '#ffffff',
  press: '#ff6b5e',
  shot: '#ffd23f',
  line: '#ffffff',
  dline: '#ffffff',
  darrow: '#ffffff',
  text: '#ffffff',
  zone: '#ffd23f',
  focus: '#ffffff',
  free: '#ff6b5e',
}

export const TOOL_NAME: Record<Tool, string> = {
  move: t('Mover'),
  pass: t('Pase'),
  lob: t('Pase aéreo'),
  run: t('Carrera'),
  arrow: t('Flecha'),
  dribble: t('Conducción'),
  press: t('Presión'),
  shot: t('Tiro'),
  line: t('Línea'),
  dline: t('Línea punteada'),
  darrow: t('Flecha punteada'),
  text: t('Texto'),
  zone: t('Zona'),
  focus: t('Foco'),
  free: t('Libre'),
  erase: t('Borrar'),
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

// Pase aéreo: el balón describe una parábola. En la pizarra (vista desde arriba) la curva se arquea hacia arriba
// de la pantalla y su sombra va recta por el suelo. `lobAt` da el punto de la curva en u (0 = salida, 1 = llegada).
export function lobControl(a: Pt, b: Pt, bend?: number): Pt {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L
  // Sin `bend` (pases aéreos antiguos) la curva sale hacia arriba de la pantalla.
  if (bend === undefined) {
    if (ny > 0 || (Math.abs(ny) < 1e-6 && nx > 0)) { nx = -nx; ny = -ny }
    bend = Math.min(20, L * 0.5)
  }
  return [(a[0] + b[0]) / 2 + nx * bend, (a[1] + b[1]) / 2 + ny * bend]
}
export function lobAt(a: Pt, b: Pt, u: number, bend?: number): Pt {
  const c = lobControl(a, b, bend), v = 1 - u
  return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]
}
// Hacia dónde va el pase aéreo según el trazo: si lo curvas a un lado la parábola sale por ese lado (con la
// altura que le diste, dentro de unos límites) y si lo trazas casi recto va por el centro (0, en línea recta).
export function lobBend(raw: Pt[]): number {
  const a = raw[0], b = raw[raw.length - 1]
  const L = Math.hypot(b[0] - a[0], b[1] - a[1])
  if (L < 1) return 0
  const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L
  let dev = 0
  for (const p of raw) { const d = (p[0] - a[0]) * nx + (p[1] - a[1]) * ny; if (Math.abs(d) > Math.abs(dev)) dev = d }
  if (Math.abs(dev) < Math.max(1.5, L * 0.08)) return 0
  // El punto de control de la curva está al doble de distancia que su punto más alto.
  return Math.sign(dev) * Math.min(Math.max(Math.abs(dev) * 2, L * 0.25), Math.min(24, L * 0.6))
}
