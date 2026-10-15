// Copia de seguridad: un archivo con todo lo que el usuario ha creado en este dispositivo,
// para llevarlo a otro navegador, móvil u ordenador sin cuentas ni servidores.
// Incluye las jugadas guardadas (con sus pasos, movimientos y textos), «Mi identidad» con el escudo,
// el mensaje final de los vídeos y las preferencias de marca, fichas, ritmo y vídeo.

import type { SavedPlay } from './storage'
import { DEFAULT_END, type EndCard, type IdentityStore, type Profile } from './identity'
import { t } from './i18n'

const PLAYS = 'pizarra.jugadas.v1'
const IDENTITY = 'pizarra.identidad.v1'
const END = 'pizarra.mensaje.v1'
// Preferencias que se copian tal cual. Al importar solo se rellenan si en este dispositivo no hay ninguna.
const SETTINGS = ['pizarra.marca', 'pizarra.marca.tipo', 'pizarra.fichas', 'pizarra.ritmo', 'pizarra.video', 'pizarra.zonas', 'pizarra.letrero']

export interface Backup {
  app: 'TacticalPro'
  kind: 'copia-de-seguridad'
  version: 1
  created: string
  plays: SavedPlay[]
  identity: IdentityStore
  end: EndCard | null
  settings: Record<string, string>
}

export interface ImportResult { plays: number; playsSkipped: number; profiles: number; profilesSkipped: number; end: boolean }

function get<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback } catch { return fallback }
}
// Aquí sí avisamos si no se pudo guardar: importar a medias sin decirlo sería peor que no importar.
function put(key: string, v: unknown) {
  try { localStorage.setItem(key, typeof v === 'string' ? v : JSON.stringify(v)) } catch {
    throw new Error(t('No hay espacio suficiente en este navegador para guardar la copia'))
  }
}

export function makeBackup(): Backup {
  const settings: Record<string, string> = {}
  for (const k of SETTINGS) { try { const v = localStorage.getItem(k); if (v !== null) settings[k] = v } catch { /* sin almacenamiento */ } }
  return {
    app: 'TacticalPro',
    kind: 'copia-de-seguridad',
    version: 1,
    created: new Date().toISOString(),
    plays: get<SavedPlay[]>(PLAYS, []),
    identity: get<IdentityStore>(IDENTITY, { profiles: [], active: null }),
    end: get<EndCard | null>(END, null),
    settings,
  }
}

export const backupName = () => `TacticalPro-copia-${new Date().toISOString().slice(0, 10)}.json`

export function backupFile(): File {
  return new File([JSON.stringify(makeBackup())], backupName(), { type: 'application/json' })
}

// Descarga el archivo. En el móvil queda en «Descargas»; en el ordenador, en la carpeta de descargas del navegador.
export function downloadBackup() {
  const f = backupFile()
  const url = URL.createObjectURL(f)
  const a = document.createElement('a')
  a.href = url
  a.download = f.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return f
}

// Comprueba que el archivo es una copia de TacticalPro y que cada jugada tiene la forma esperada.
export function parseBackup(text: string): Backup {
  let d: unknown
  try { d = JSON.parse(text) } catch { throw new Error(t('El archivo no es una copia de seguridad de TacticalPro')) }
  const b = d as Partial<Backup>
  if (!b || b.app !== 'TacticalPro' || b.kind !== 'copia-de-seguridad') throw new Error(t('El archivo no es una copia de seguridad de TacticalPro'))
  if (typeof b.version !== 'number' || b.version > 1) throw new Error(t('Esta copia es de una versión más nueva de TacticalPro: actualiza la app y vuelve a intentarlo'))
  const plays = Array.isArray(b.plays) ? b.plays.filter(isPlay) : []
  const profiles = Array.isArray(b.identity?.profiles) ? b.identity!.profiles.filter(isProfile) : []
  return {
    app: 'TacticalPro', kind: 'copia-de-seguridad', version: 1, created: String(b.created ?? ''),
    plays,
    identity: { profiles, active: typeof b.identity?.active === 'string' ? b.identity.active : null },
    end: b.end && typeof b.end === 'object' ? { ...DEFAULT_END, ...b.end } : null,
    settings: b.settings && typeof b.settings === 'object' ? b.settings : {},
  }
}

function isPlay(p: unknown): p is SavedPlay {
  const x = p as SavedPlay
  return !!x && typeof x.id === 'string' && typeof x.name === 'string' && !!x.board &&
    Array.isArray(x.board.tokens) && Array.isArray(x.board.drawings) && typeof x.board.pitch === 'string'
}
function isProfile(p: unknown): p is Profile {
  const x = p as Profile
  return !!x && typeof x.id === 'string' && typeof x.coach === 'string'
}

// Dos jugadas son la misma si tienen el mismo identificador, o el mismo nombre y exactamente el mismo contenido.
const sameBoard = (a: SavedPlay, b: SavedPlay) => a.name === b.name && JSON.stringify(a.board) === JSON.stringify(b.board)
const profileKey = (p: Profile) => JSON.stringify([p.coach, p.role, p.club, p.slogan, p.crest ?? ''])
const endIsBlank = (e: EndCard | null) => !e || (!e.on && !e.phrase.trim())

// Añade lo de la copia a lo que ya hay: nunca borra ni cambia nada existente y no repite lo que ya está.
export function importBackup(b: Backup): ImportResult {
  const r: ImportResult = { plays: 0, playsSkipped: 0, profiles: 0, profilesSkipped: 0, end: false }

  const plays = get<SavedPlay[]>(PLAYS, [])
  for (const p of b.plays) {
    if (plays.some((q) => q.id === p.id || sameBoard(q, p))) { r.playsSkipped++; continue }
    plays.push(p)
    r.plays++
  }

  const id = get<IdentityStore>(IDENTITY, { profiles: [], active: null })
  const profiles = [...(id.profiles ?? [])]
  const keys = new Set(profiles.map(profileKey))
  let active = id.active
  for (const p of b.identity.profiles) {
    if (profiles.some((q) => q.id === p.id) || keys.has(profileKey(p))) { r.profilesSkipped++; continue }
    profiles.push(p)
    keys.add(profileKey(p))
    r.profiles++
  }
  // Si aquí no había un perfil activo, se usa el que estaba activo en la copia.
  if (!active || !profiles.some((p) => p.id === active)) {
    const fromBackup = b.identity.active && profiles.find((p) => p.id === b.identity.active)
    active = fromBackup ? fromBackup.id : profiles[0]?.id ?? null
  }

  let end = get<EndCard | null>(END, null)
  if (b.end) {
    if (endIsBlank(end)) { end = b.end; r.end = true }
    else {
      // Se conserva el mensaje de aquí y se suman las frases favoritas de la copia.
      const fav = [...end!.favorites, ...b.end.favorites.filter((f) => !end!.favorites.includes(f))]
      if (fav.length !== end!.favorites.length) { end = { ...end!, favorites: fav }; r.end = true }
    }
  }

  // Se guarda todo junto al final; si falta espacio, avisamos sin dejar una importación a medias.
  const before = { plays: localStorage.getItem(PLAYS), id: localStorage.getItem(IDENTITY), end: localStorage.getItem(END) }
  try {
    put(PLAYS, plays)
    put(IDENTITY, { profiles, active })
    if (end) put(END, end)
  } catch (e) {
    for (const [k, v] of [[PLAYS, before.plays], [IDENTITY, before.id], [END, before.end]] as const) {
      try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { /* nada más que hacer */ }
    }
    throw e
  }
  for (const [k, v] of Object.entries(b.settings)) {
    if (SETTINGS.includes(k) && typeof v === 'string') { try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v) } catch { /* sin almacenamiento */ } }
  }
  return r
}

export function describeImport(r: ImportResult) {
  const skipped = r.playsSkipped + r.profilesSkipped
  const same = skipped === 1 ? t('Había 1 elemento que ya tenías y no se ha duplicado.') : t('Había {n} elementos que ya tenías y no se han duplicado.', { n: skipped })
  if (!r.plays && !r.profiles && !r.end) return skipped ? t('No había nada nuevo en la copia.') + ' ' + same : t('La copia está vacía.')
  const parts: string[] = []
  if (r.plays) parts.push(r.plays === 1 ? t('1 jugada nueva') : t('{n} jugadas nuevas', { n: r.plays }))
  if (r.profiles) parts.push(r.profiles === 1 ? t('1 perfil de Mi identidad') : t('{n} perfiles de Mi identidad', { n: r.profiles }))
  if (r.end && !parts.length) parts.push(t('el mensaje final de los vídeos'))
  return t('Copia importada: {x}.', { x: parts.join(t(' y ')) }) + (skipped ? ' ' + same : '')
}
