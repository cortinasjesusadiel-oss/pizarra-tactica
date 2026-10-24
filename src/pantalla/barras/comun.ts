import { useEffect } from 'react'

// Al girar el móvil los botones cambian de sitio: los menús abiertos se cierran para que no queden flotando en otro lugar.
export function useCerrarAlGirar(close: () => void) {
  useEffect(() => {
    window.addEventListener('orientationchange', close)
    const m = window.matchMedia?.('(orientation: landscape)')
    m?.addEventListener('change', close)
    return () => { window.removeEventListener('orientationchange', close); m?.removeEventListener('change', close) }
  }, [close])
}

// Hojas que se abren desde las barras.
export type SheetId = 'templates' | 'plays' | 'material' | 'sessions' | 'tips' | 'export' | 'learn' | 'look' | 'identity' | 'help'
