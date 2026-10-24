import { useEffect, useState } from 'react'
import type { Board } from '../model'
import { saveLast, type SaveResult } from '../storage'

// Autoguardado de la pizarra abierta en cada cambio.
// Devuelve el fallo si el dispositivo no deja guardar (null si se guardó bien), para avisar con una franja fija.
export function useAutoguardado(board: Board): SaveResult | null {
  const [saveFail, setSaveFail] = useState<SaveResult | null>(null)
  useEffect(() => { const r = saveLast(board); setSaveFail(r.ok ? null : r) }, [board])
  return saveFail
}
