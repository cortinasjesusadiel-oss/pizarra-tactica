import { useCallback, useState, type MutableRefObject } from 'react'
import type { Board } from '../nucleo/model'
import { clipRate, type Pace } from '../nucleo/motion'
import { tr } from '../i18n'
import { holdAt, holdTotal, holdWall, readHolds, type Focus } from './clip'

// Pizarra personal: reproducción de la jugada grabada en tiempo real, de seguido.
// Usa la misma animación de la pizarra (anim, playing); aquí se guarda el segundo en el que está parada
// y el pase que se resalta en los momentos clave.
export type ContextoRepro = {
  board: Board
  pace: Pace
  raf: MutableRefObject<number>
  animRef: MutableRefObject<number | null>
  setAnim: (s: number | null) => void
  setAnimState: (s: number | null) => void
  setPlaying: (p: boolean) => void
  setSelected: (id: string | null) => void
}

export function useReproGrabada(c: ContextoRepro) {
  const { board, pace, raf, animRef, setAnim, setAnimState, setPlaying, setSelected } = c
  // Segundo de la jugada grabada en el que está parada.
  const [clipT, setClipT] = useState(0)
  const [focus, setFocus] = useState<Focus | null>(null)

  // Al parar la animación: se quita el resalte y la jugada se queda donde iba.
  const alParar = useCallback((a: number | null) => { setFocus(null); if (a !== null) setClipT(a) }, [])

  function desde(from: number | null) {
    const clip = board.clip
    if (!clip) return
    cancelAnimationFrame(raf.current)
    setSelected(null)
    const start = from ?? (clipT >= clip.dur - 0.05 ? 0 : clipT)
    setPlaying(true)
    setAnim(start)
    // Se cuenta el tiempo de reproducción (con las pausas de los momentos clave) y se pasa al de la jugada.
    const t0 = performance.now(), rate = clipRate(pace), reads = readHolds(clip, (board.frames ?? []).map((f) => f.note && tr(f.note)))
    const w0 = holdWall(clip, start, reads), total = holdTotal(clip, reads)
    const tick = (now: number) => {
      const w = w0 + ((now - t0) / 1000) * rate
      if (w < total) { const h = holdAt(clip, w, reads); setFocus(h.focus); setAnim(h.s); raf.current = requestAnimationFrame(tick) }
      else { animRef.current = null; setAnimState(null); setFocus(null); setClipT(clip.dur); setPlaying(false) }
    }
    raf.current = requestAnimationFrame(tick)
  }

  // Reproducir desde el principio (o desde donde está). Devuelve false si la jugada no es grabada.
  const empezar = (fromStart: boolean) => {
    if (!board.clip) return false
    if (fromStart) setClipT(0)
    desde(fromStart ? 0 : null)
    return true
  }
  // Botón Reproducir / Pausa. Devuelve false si la jugada no es grabada.
  const alternar = (playing: boolean, stopAnim: () => void) => {
    if (!board.clip) return false
    if (playing) stopAnim(); else desde(null)
    return true
  }
  // Instante que se dibuja en el campo.
  const instante = (anim: number | null, cur: number) => (board.clip ? anim ?? clipT : anim ?? cur)

  return { clipT, setClipT, focus: board.clip ? focus : null, alParar, empezar, alternar, instante }
}

export type ReproGrabada = ReturnType<typeof useReproGrabada>
