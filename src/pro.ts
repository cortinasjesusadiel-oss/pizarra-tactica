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

export const PRO = typeof window !== 'undefined' && leer()
