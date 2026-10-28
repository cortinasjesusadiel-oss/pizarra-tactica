import { useEffect, useState } from 'react'
import { DEFAULT_LOOK, type Look } from './model'
import { DEFAULT_PACE, type Pace } from './motion'
import { loadEnd, loadIdentity, saveEnd, saveIdentity, type BrandMode, type EndCard, type IdentityStore } from './identity'
import { guardar, leer, leerJson } from './memoria'

// Preferencias del entrenador guardadas en el dispositivo. Cada una se lee al abrir y se guarda al cambiarla.

// Aviso de bienvenida: sale hasta que se cierra una vez.
const AYUDA = 'pizarra.ayuda.v2'
export const primeraVez = () => { try { return !localStorage.getItem(AYUDA) } catch { return true } }
export const ayudaVista = () => guardar(AYUDA, '1')

// Orientación del campo elegida a mano: true = vertical, false = horizontal, null = nunca elegida.
const ORIENTACION = 'pizarra.orientacion'
export function useOrientacion() {
  const [pref, setPref] = useState<boolean | null>(() => { const v = leer(ORIENTACION); return v ? v === 'v' : null })
  const elegir = (v: boolean) => { guardar(ORIENTACION, v ? 'v' : 'h'); setPref(v) }
  return [pref, elegir] as const
}

// Estilo del último letrero escrito: el siguiente sale igual.
const LETRERO = 'pizarra.letrero'
export type EstiloLetrero = { color: string; bg: string; fs: number }
export function leerEstiloLetrero(): Partial<EstiloLetrero> {
  try { return JSON.parse(localStorage.getItem(LETRERO) ?? '{}') } catch { return {} }
}
export const guardarEstiloLetrero = (s: EstiloLetrero) => guardar(LETRERO, JSON.stringify(s))

// Opciones del vídeo: letra grande para el móvil y pantalla final con el logo.
export type VideoOpts = { big: boolean; outro: boolean; full?: boolean }
// El cierre con el logo de TacticalPro sale por defecto en todos los vídeos; el entrenador puede quitarlo
// y entonces se recuerda su elección (se guarda aparte para que la opción antigua, apagada, no cuente).
const OUTRO_KEY = 'pizarra.cierre'
const VIDEO = 'pizarra.video'
export function loadVopts(): VideoOpts {
  let v: VideoOpts = { big: false, outro: true }
  try {
    v = { ...v, ...JSON.parse(localStorage.getItem(VIDEO) ?? '{}') }
    const c = localStorage.getItem(OUTRO_KEY)
    v.outro = c === null ? true : c === '1'
  } catch { /* sin almacenamiento */ }
  return v
}

const ZONAS = 'pizarra.zonas'
const RITMO = 'pizarra.ritmo'
const FICHAS = 'pizarra.fichas'
const MARCA = 'pizarra.marca'
const MARCA_TIPO = 'pizarra.marca.tipo'
const leerMarca = () => leer(MARCA) ?? 'TacticalPro'
const leerMarcaTipo = () => (leer(MARCA_TIPO) as BrandMode) || 'text'

// Todas las preferencias juntas. `onIdentityFail` avisa si «Mi identidad» no cabe en el dispositivo.
// `leerFichas` permite leer las fichas de otra forma al abrir (enchufe; en la web se leen las guardadas).
export function usePreferencias(onIdentityFail: () => void, leerFichas: () => Look = () => leerJson(FICHAS, DEFAULT_LOOK)) {
  // Zonas del campo (carriles y alturas) encima del césped.
  const [zones, setZones] = useState(() => leer(ZONAS) === '1')
  const toggleZones = () => setZones((z) => { guardar(ZONAS, z ? '0' : '1'); return !z })

  // Ritmo elegido (segundos por paso y velocidad). Vale para reproducir y para el vídeo.
  const [pace, setPaceState] = useState<Pace>(() => leerJson(RITMO, DEFAULT_PACE))
  const setPace = (patch: Partial<Pace>) => setPaceState((p) => {
    const next = { ...p, ...patch }
    guardar(RITMO, JSON.stringify(next))
    return next
  })

  // Aspecto de las fichas (forma, número/nombre y colores de cada equipo).
  const [look, setLookState] = useState<Look>(leerFichas)
  const setLook = (patch: Partial<Look>) => setLookState((l) => {
    const n = { ...l, ...patch }
    guardar(FICHAS, JSON.stringify(n))
    return n
  })
  useEffect(() => {
    document.documentElement.style.setProperty('--home', look.home)
    document.documentElement.style.setProperty('--away', look.away)
  }, [look.home, look.away])

  // Marca de agua (por defecto TacticalPro); vacía = sin marca.
  const [brand, setBrandState] = useState(leerMarca)
  const setBrand = (v: string) => { setBrandState(v); guardar(MARCA, v) }
  // Tipo de marca: el texto «TacticalPro» por defecto (así nadie exporta con la firma de otra persona), el logo del autor, la identidad propia o ninguna.
  const [brandMode, setBrandModeState] = useState<BrandMode>(leerMarcaTipo)
  const setBrandMode = (m: BrandMode) => { setBrandModeState(m); guardar(MARCA_TIPO, m) }

  // Mi identidad: perfiles del entrenador (nombre, cargo, club, escudo, eslogan) y el mensaje final de los vídeos.
  const [idStore, setIdStoreState] = useState<IdentityStore>(loadIdentity)
  const setIdStore = (f: (s: IdentityStore) => IdentityStore) => setIdStoreState((s) => {
    const next = f(s)
    if (!saveIdentity(next)) onIdentityFail()
    return next
  })
  const [endCard, setEndState] = useState<EndCard>(loadEnd)
  const setEnd = (patch: Partial<EndCard>) => setEndState((e) => { const next = { ...e, ...patch }; saveEnd(next); return next })

  const [vopts, setVoptsState] = useState<VideoOpts>(loadVopts)
  const setVopts = (patch: Partial<VideoOpts>) => setVoptsState((v) => {
    const next = { ...v, ...patch }
    try {
      localStorage.setItem(VIDEO, JSON.stringify(next))
      if ('outro' in patch) localStorage.setItem(OUTRO_KEY, next.outro ? '1' : '0')
    } catch { /* sin almacenamiento */ }
    return next
  })

  // Tras importar una copia de seguridad se vuelve a leer lo guardado, para que «Mi identidad» y las preferencias nuevas se vean ya.
  const recargar = () => {
    setIdStoreState(loadIdentity())
    setEndState(loadEnd())
    setPaceState(leerJson(RITMO, DEFAULT_PACE))
    setLookState(leerJson(FICHAS, DEFAULT_LOOK))
    setVoptsState(loadVopts())
    try {
      setBrandState(localStorage.getItem(MARCA) ?? 'TacticalPro')
      setBrandModeState((localStorage.getItem(MARCA_TIPO) as BrandMode) || 'text')
      setZones(localStorage.getItem(ZONAS) === '1')
    } catch { /* sin almacenamiento */ }
  }

  return {
    zones, toggleZones, pace, setPace, look, setLook, brand, setBrand, brandMode, setBrandMode,
    idStore, setIdStore, endCard, setEnd, vopts, setVopts, recargar,
  }
}
