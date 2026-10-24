import type { Board } from './model'
import { cleanBoard } from './validation'

// Jugadas guardadas en este dispositivo. Cuando haya cuentas de usuario se sincronizarán con el servidor.
export interface SavedPlay {
  id: string
  name: string
  updated: number
  board: Board
}

const KEY = 'pizarra.jugadas.v1'
const LAST = 'pizarra.ultima.v1'
// Si lo guardado está dañado, se aparta aquí sin borrarlo, para poder recuperarlo.
export const DAMAGED = 'pizarra.jugadas.v1.danado'

// Resultado de guardar: la interfaz solo dice «guardado» si de verdad se escribió.
export type SaveResult = { ok: true } | { ok: false; reason: 'lleno' | 'bloqueado' }

function raw(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function parse(text: string | null): unknown {
  if (text === null) return undefined
  try { return JSON.parse(text) } catch { return text }
}
function write(key: string, value: unknown): SaveResult {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return { ok: true }
  } catch (e) {
    const full = e instanceof DOMException && (/quota/i.test(e.name) || e.code === 22)
    return { ok: false, reason: full ? 'lleno' : 'bloqueado' }
  }
}
// Guarda una copia exacta de lo dañado (solo la primera vez, para no pisar la original).
function keepDamaged(text: string) {
  try { if (localStorage.getItem(DAMAGED) === null) localStorage.setItem(DAMAGED, text) } catch { /* sin almacenamiento */ }
}

export function isPlay(v: unknown): v is SavedPlay {
  const p = v as SavedPlay
  return !!p && typeof p === 'object' && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.updated === 'number' && Number.isFinite(p.updated)
}
// Comprueba una jugada y devuelve una copia limpia, o null si no se puede abrir con seguridad.
export function cleanPlay(v: unknown): SavedPlay | null {
  if (!isPlay(v)) return null
  const board = cleanBoard(v.board)
  return board ? { id: v.id, name: v.name, updated: v.updated, board } : null
}

export function listPlays(): SavedPlay[] {
  const text = raw(KEY)
  const data = parse(text)
  if (data === undefined) return []
  if (!Array.isArray(data)) { keepDamaged(text!); return [] }
  const plays = data.map(cleanPlay).filter((p): p is SavedPlay => !!p)
  if (plays.length !== data.length) keepDamaged(text!)
  return plays.sort((a, b) => b.updated - a.updated)
}

// ¿Hay jugadas apartadas por estar dañadas? Se ofrece descargarlas para recuperarlas.
export const damagedPlays = (): string | null => raw(DAMAGED)

export function savePlay(play: SavedPlay): SaveResult {
  const all = listPlays().filter((p) => p.id !== play.id)
  return write(KEY, [play, ...all])
}

export const deletePlay = (id: string): SaveResult => write(KEY, listPlays().filter((p) => p.id !== id))

export const loadLast = (): Board | null => cleanBoard(parse(raw(LAST)))
export const saveLast = (b: Board): SaveResult => write(LAST, b)
