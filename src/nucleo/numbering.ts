// Dorsales para los jugadores sin número de una plantilla (por ejemplo, los rivales), para poder decir
// «el 8 rival recibe». Se conservan los dorsales que ya hay, los identificadores, posiciones y pasos.
// Solo se usa al cargar plantillas: las jugadas del usuario nunca se renumeran.
import type { Board } from './model'

export function numberPlayers(b: Board): Board {
  if (!b.tokens.some((t) => t.kind === 'player' && !t.label.trim())) return b
  const tokens = b.tokens.map((t) => ({ ...t }))
  for (const team of ['home', 'away'] as const) {
    const mine = tokens.filter((t) => t.kind === 'player' && t.team === team)
    const used = new Set(mine.map((t) => t.label.trim()).filter(Boolean))
    // De su portería hacia delante: el local defiende la izquierda y el rival la derecha.
    const blank = mine.filter((t) => !t.label.trim()).sort((p, q) => (team === 'away' ? q.x - p.x : p.x - q.x))
    let n = used.has('1') || !blank.length ? 2 : 1
    for (const t of blank) { while (used.has(String(n))) n++; t.label = String(n); used.add(String(n)) }
  }
  return { ...b, tokens }
}
