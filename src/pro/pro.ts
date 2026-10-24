// Funciones Pro (jugada grabada en tiempo real, defensa automática, orientación de los jugadores y reproducción
// continua). Están en la app pero apagadas para todos: el dueño las enciende en sus aparatos abriendo una vez
// la pizarra con ?pro=<código>. Con ?pro=off se apagan. Se guarda en el dispositivo.
// Nota: el código va dentro de la app (solo se guarda su huella); para venderlo haría falta un sistema de licencias.
const KEY = 'pizarra.pro'
const HUELLA = 1615412691

const huella = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0 } return h }

function leer(): boolean {
  try {
    const u = new URL(location.href)
    const c = u.searchParams.get('pro')
    if (c !== null) {
      if (c === 'off') localStorage.removeItem(KEY)
      else if (huella(c) === HUELLA) localStorage.setItem(KEY, '1')
      u.searchParams.delete('pro')
      history.replaceState(null, '', u.pathname + u.search + u.hash)
    }
    return localStorage.getItem(KEY) === '1'
  } catch { return false }
}

// La pizarra personal del dueño (un archivo, build «mia») siempre lleva lo Pro.
export const PERSONAL = import.meta.env.MODE === 'mia'
export const PRO = PERSONAL || (typeof window !== 'undefined' && leer())

// En la versión Pro, las fichas de las plantillas que vienen sin número (sobre todo las del rival) reciben uno,
// del 2 al 11 y más, empezando por las más cercanas a su propia portería. El arquero ya trae el 1.
export function numberPlayers<B extends { tokens: { kind: string; team?: string; label: string; x: number }[] }>(b: B): B {
  if (!PRO) return b
  const tokens = b.tokens.map((t) => ({ ...t }))
  for (const team of ['home', 'away']) {
    const mine = tokens.filter((t) => t.kind === 'player' && t.team === team)
    const used = new Set(mine.map((t) => t.label).filter(Boolean))
    const blank = mine.filter((t) => !t.label.trim()).sort((p, q) => (team === 'away' ? q.x - p.x : p.x - q.x))
    let n = used.has('1') || !blank.length ? 2 : 1
    for (const t of blank) { while (used.has(String(n))) n++; t.label = String(n); used.add(String(n)) }
  }
  return { ...b, tokens }
}
