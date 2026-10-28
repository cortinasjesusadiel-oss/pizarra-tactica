import type { Board } from './model'
import { loadLast } from './storage'

// Enlace directo a una plantilla: tacticalpro.app/pizarra/?jugada=<id de la plantilla>
// Lo usan la biblioteca de la web y los vídeos: «abre esta jugada y cámbiala».
// Se abre una copia nueva de la plantilla; las jugadas guardadas no se tocan y la pizarra
// que estaba abierta queda en ↶ (deshacer) para poder volver a ella.
export const PARAM_JUGADA = 'jugada'

export interface JugadaEnlace {
  // Id pedido en el enlace (puede no existir).
  id: string
  // Pizarra que estaba abierta antes, para dejarla en ↶.
  previa: Board | null
}

// Lee ?jugada= una sola vez al arrancar y lo quita de la dirección, para que al recargar
// no se vuelva a abrir la plantilla encima de lo que el usuario haya cambiado.
export function leerJugadaDelEnlace(): JugadaEnlace | null {
  try {
    const u = new URL(location.href)
    const id = u.searchParams.get(PARAM_JUGADA)?.trim()
    if (!id) return null
    u.searchParams.delete(PARAM_JUGADA)
    history.replaceState(history.state, '', u.pathname + u.search + u.hash)
    // Se lee ahora, antes de que el autoguardado escriba la plantilla encima.
    return { id: id.slice(0, 80), previa: loadLast() }
  } catch {
    return null
  }
}
