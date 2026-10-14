import type { Board } from './model'

// Jugadas guardadas en este dispositivo. Cuando haya cuentas de usuario se sincronizarán con el servidor.
export interface SavedPlay {
  id: string
  name: string
  updated: number
  board: Board
}

const KEY = 'pizarra.jugadas.v1'
const LAST = 'pizarra.ultima.v1'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* almacenamiento no disponible: la app sigue funcionando sin guardar */
  }
}

export const listPlays = () => read<SavedPlay[]>(KEY, []).sort((a, b) => b.updated - a.updated)

export function savePlay(play: SavedPlay) {
  const all = listPlays().filter((p) => p.id !== play.id)
  write(KEY, [play, ...all])
}

export const deletePlay = (id: string) => write(KEY, listPlays().filter((p) => p.id !== id))

export const loadLast = () => read<Board | null>(LAST, null)
export const saveLast = (b: Board) => write(LAST, b)
