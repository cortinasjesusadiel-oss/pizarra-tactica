import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { Board } from '../model'

// Deshacer y rehacer: guarda hasta 100 pizarras anteriores.
// `board`/`setBoard` es la pizarra abierta; `setBoard` la cambia sin dejar rastro en el historial
// (para los pasos intermedios de un arrastre, que se apuntan una sola vez al empezar con `apuntar`).
export type Historial = {
  board: Board
  setBoard: Dispatch<SetStateAction<Board>>
  // Cambio que se puede deshacer.
  commit: (next: Board | ((b: Board) => Board)) => void
  // Apunta la pizarra de antes de un cambio hecho a mano (arrastre, dibujo…).
  apuntar: (b: Board) => void
  // Quita el último apunte (el cambio no llegó a hacerse).
  olvidar: () => void
  // Vuelven atrás o adelante; devuelven false si no había nada.
  deshacer: () => boolean
  rehacer: () => boolean
  puedeDeshacer: boolean
  puedeRehacer: boolean
  // Vuelve a pintar los botones de deshacer y rehacer.
  refrescar: () => void
}

export function useHistorial(inicial: () => Board): Historial {
  const [board, setBoard] = useState<Board>(inicial)
  const past = useRef<Board[]>([])
  const future = useRef<Board[]>([])
  const [, force] = useState(0)
  const refrescar = useCallback(() => force((x) => x + 1), [])

  const commit = useCallback((next: Board | ((b: Board) => Board)) => {
    setBoard((b) => {
      const n = typeof next === 'function' ? next(b) : next
      past.current.push(b)
      if (past.current.length > 100) past.current.shift()
      future.current = []
      return n
    })
    force((x) => x + 1)
  }, [])

  const apuntar = useCallback((b: Board) => {
    past.current.push(b)
    future.current = []
  }, [])
  const olvidar = useCallback(() => { past.current.pop() }, [])

  const deshacer = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return false
    setBoard((b) => { future.current.push(b); return prev })
    return true
  }, [])
  const rehacer = useCallback(() => {
    const next = future.current.pop()
    if (!next) return false
    setBoard((b) => { past.current.push(b); return next })
    return true
  }, [])

  return {
    board, setBoard, commit, apuntar, olvidar, deshacer, rehacer, refrescar,
    puedeDeshacer: past.current.length > 0,
    puedeRehacer: future.current.length > 0,
  }
}
