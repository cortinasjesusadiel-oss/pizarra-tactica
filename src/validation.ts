// Reglas comunes para comprobar pizarras que vienen de fuera de la app (copias de seguridad)
// o del almacenamiento del dispositivo, que puede estar dañado.
// Si algo no tiene arreglo seguro, la pizarra se descarta entera: mejor no abrirla que romper la app al dibujarla.

import { PITCH, type Board, type Drawing, type Frame, type Pt, type Token } from './model'

const KINDS = new Set(['player', 'ball', 'cone', 'disc', 'pole', 'hurdle', 'ring', 'ladder', 'minigoal', 'goal', 'mannequin', 'wall', 'rebounder', 'flag'])
const TEAMS = new Set(['home', 'away', 'neutral'])
const TOOLS = new Set(['pass', 'lob', 'run', 'arrow', 'dribble', 'press', 'shot', 'line', 'dline', 'darrow', 'text', 'zone', 'focus', 'free'])

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const str = (v: unknown): v is string => typeof v === 'string'
const isPt = (p: unknown): p is Pt => Array.isArray(p) && p.length === 2 && num(p[0]) && num(p[1])

function token(v: unknown): Token | null {
  if (!isObj(v) || !str(v.id) || !v.id || !KINDS.has(v.kind as string) || !TEAMS.has(v.team as string) || !num(v.x) || !num(v.y)) return null
  // Se conservan los campos que no conocemos (versiones más nuevas) y se quitan los opcionales que vienen mal.
  const t = { ...v, label: str(v.label) ? v.label : '' } as Record<string, unknown>
  if (t.name !== undefined && !str(t.name)) delete t.name
  if (t.rot !== undefined && !num(t.rot)) delete t.rot
  if (t.size !== undefined && !(num(t.size) && t.size > 0)) delete t.size
  return t as unknown as Token
}

function drawing(v: unknown): Drawing | null {
  if (!isObj(v) || !str(v.id) || !TOOLS.has(v.type as string) || !Array.isArray(v.points) || v.points.length === 0 || !v.points.every(isPt)) return null
  const d = { ...v, color: str(v.color) ? v.color : '#ffffff', width: num(v.width) && v.width > 0 ? v.width : 0.5 } as Record<string, unknown>
  if (d.text !== undefined && !str(d.text)) delete d.text
  if (d.bg !== undefined && !str(d.bg)) delete d.bg
  if (d.fs !== undefined && !(num(d.fs) && d.fs > 0)) delete d.fs
  if (d.bend !== undefined && !num(d.bend)) delete d.bend
  return d as unknown as Drawing
}

function list<T>(v: unknown, f: (x: unknown) => T | null): T[] | null {
  if (!Array.isArray(v)) return null
  const out: T[] = []
  for (const x of v) { const y = f(x); if (!y) return null; out.push(y) }
  return out
}

function frame(v: unknown, ids: Set<string>): Frame | null {
  if (!isObj(v)) return null
  const pos: Record<string, Pt> = {}
  if (v.pos !== undefined) {
    if (!isObj(v.pos)) return null
    for (const [id, p] of Object.entries(v.pos)) {
      if (!isPt(p)) return null
      // Posiciones de fichas que ya no existen: no molestan, pero no se conservan.
      if (ids.has(id)) pos[id] = p
    }
  }
  const drawings = v.drawings === undefined ? [] : list(v.drawings, drawing)
  if (!drawings) return null
  return { ...v, pos, drawings, note: str(v.note) ? v.note : '' } as Frame
}

// Devuelve una copia limpia de la pizarra, o null si no se puede abrir con seguridad.
export function cleanBoard(v: unknown): Board | null {
  if (!isObj(v) || !str(v.pitch) || !Object.prototype.hasOwnProperty.call(PITCH, v.pitch)) return null
  const tokens = list(v.tokens, token)
  const drawings = list(v.drawings, drawing)
  if (!tokens || !drawings) return null
  const b = { ...v, pitch: v.pitch as Board['pitch'], tokens, drawings } as Board
  delete b.frames
  if (v.frames !== undefined && v.frames !== null) {
    // Una animación necesita al menos un paso: una lista vacía no es una animación válida.
    const ids = new Set(tokens.map((t) => t.id))
    const frames = Array.isArray(v.frames) && v.frames.length > 0 ? list(v.frames, (f) => frame(f, ids)) : null
    if (!frames) return null
    b.frames = frames
  }
  return b
}

// Lista de textos (por ejemplo, las frases favoritas del cierre); cualquier otra cosa se convierte en lista vacía.
export const cleanStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter(str) : [])
