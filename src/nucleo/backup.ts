// Copia de seguridad: un archivo con todo lo que el usuario ha creado en este dispositivo,
// para llevarlo a otro navegador, móvil u ordenador sin cuentas ni servidores.
// Incluye las jugadas guardadas (con sus pasos, movimientos y textos), la pizarra que está abierta aunque no se haya
// guardado, «Mi identidad» con el escudo,
// el mensaje final de los vídeos y las preferencias de marca, fichas, ritmo y vídeo.

import type { Board } from './model'
import { cleanPlay, listPlays, type SavedPlay } from './storage'
import { cleanBoard, cleanStrings } from './validation'
import { DEFAULT_END, type EndCard, type IdentityStore, type Profile } from './identity'
import { t } from '../i18n'

const PLAYS = 'pizarra.jugadas.v1'
const IDENTITY = 'pizarra.identidad.v1'
const END = 'pizarra.mensaje.v1'
const LAST = 'pizarra.ultima.v1'
// Cuándo se hizo la última copia en este dispositivo, para recordárselo al usuario.
export const LAST_BACKUP = 'pizarra.copia.ultima'
// Preferencias que se copian tal cual. Al importar solo se rellenan si en este dispositivo no hay ninguna.
const SETTINGS = ['pizarra.marca', 'pizarra.marca.tipo', 'pizarra.fichas', 'pizarra.ritmo', 'pizarra.video', 'pizarra.zonas', 'pizarra.letrero', 'pizarra.cierre']

export interface Backup {
  app: 'TacticalPro'
  kind: 'copia-de-seguridad'
  version: 1
  created: string
  plays: SavedPlay[]
  // La pizarra abierta en el momento de la copia (si tiene algo y no está ya entre las guardadas).
  current?: Board | null
  identity: IdentityStore
  end: EndCard | null
  settings: Record<string, string>
  // Solo al leer un archivo: jugadas que venían dañadas y no se importan.
  discarded?: number
}

export interface ImportResult { damaged: number; plays: number; playsSkipped: number; profiles: number; profilesSkipped: number; end: boolean; current: boolean }

function get<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback } catch { return fallback }
}
// Aquí sí avisamos si no se pudo guardar: importar a medias sin decirlo sería peor que no importar.
function put(key: string, v: unknown) {
  try { localStorage.setItem(key, typeof v === 'string' ? v : JSON.stringify(v)) } catch {
    throw new Error(t('No hay espacio suficiente en este navegador para guardar la copia'))
  }
}

const hasContent = (b: Board | null | undefined): b is Board => !!b && (b.tokens.length > 0 || b.drawings.length > 0)
const sameContent = (a: Board, b: Board) => JSON.stringify(a) === JSON.stringify(b)

export function makeBackup(open?: Board | null): Backup {
  const plays = listPlays()
  const cur = open ?? get<Board | null>(LAST, null)
  const current = hasContent(cur) && !plays.some((p) => sameContent(p.board, cur)) ? cur : null
  const settings: Record<string, string> = {}
  for (const k of SETTINGS) { try { const v = localStorage.getItem(k); if (v !== null) settings[k] = v } catch { /* sin almacenamiento */ } }
  return {
    app: 'TacticalPro',
    kind: 'copia-de-seguridad',
    version: 1,
    created: new Date().toISOString(),
    plays,
    current,
    identity: get<IdentityStore>(IDENTITY, { profiles: [], active: null }),
    end: get<EndCard | null>(END, null),
    settings,
  }
}

export const backupName = () => `TacticalPro-copia-${new Date().toISOString().slice(0, 10)}.json`

export function backupFile(open?: Board | null): File {
  return new File([JSON.stringify(makeBackup(open))], backupName(), { type: 'application/json' })
}

export function markBackupDone() { try { localStorage.setItem(LAST_BACKUP, new Date().toISOString()) } catch { /* sin almacenamiento */ } }
export function lastBackup(): Date | null {
  try { const v = localStorage.getItem(LAST_BACKUP); const d = v ? new Date(v) : null; return d && !isNaN(+d) ? d : null } catch { return null }
}

// Descarga el archivo. En el móvil queda en «Descargas»; en el ordenador, en la carpeta de descargas del navegador.
export function downloadBackup(open?: Board | null) {
  const f = backupFile(open)
  const url = URL.createObjectURL(f)
  const a = document.createElement('a')
  a.href = url
  a.download = f.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  markBackupDone()
  return f
}

// Comprueba que el archivo es una copia de TacticalPro y que cada jugada tiene la forma esperada.
export function parseBackup(text: string): Backup {
  let d: unknown
  try { d = JSON.parse(text) } catch { throw new Error(t('El archivo no es una copia de seguridad de TacticalPro')) }
  const b = d as Partial<Backup>
  if (!b || b.app !== 'TacticalPro' || b.kind !== 'copia-de-seguridad') throw new Error(t('El archivo no es una copia de seguridad de TacticalPro'))
  if (typeof b.version !== 'number' || b.version > 1) throw new Error(t('Esta copia es de una versión más nueva de TacticalPro: actualiza la app y vuelve a intentarlo'))
  const all = Array.isArray(b.plays) ? b.plays : []
  const plays = all.map(cleanPlay).filter((p): p is SavedPlay => !!p)
  const profiles = Array.isArray(b.identity?.profiles) ? b.identity!.profiles.filter(isProfile) : []
  return {
    app: 'TacticalPro', kind: 'copia-de-seguridad', version: 1, created: String(b.created ?? ''),
    plays,
    current: cleanBoard(b.current),
    identity: { profiles, active: typeof b.identity?.active === 'string' ? b.identity.active : null },
    end: b.end && typeof b.end === 'object' ? cleanEnd(b.end) : null,
    settings: cleanSettings(b.settings),
    discarded: all.length - plays.length,
  }
}

// Mensaje final de los vídeos: lo que no tenga el tipo esperado se cambia por el valor por defecto.
function cleanEnd(v: object): EndCard {
  const e = { ...DEFAULT_END, ...v } as EndCard
  const d = DEFAULT_END as unknown as Record<string, unknown>
  const out = e as unknown as Record<string, unknown>
  for (const k of Object.keys(d)) if (typeof out[k] !== typeof d[k] || out[k] === null) out[k] = d[k]
  e.favorites = cleanStrings((v as Partial<EndCard>).favorites)
  return e
}
function cleanSettings(v: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, x] of Object.entries(v)) if (typeof x === 'string') out[k] = x
  return out
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
  const r: ImportResult = { damaged: b.discarded ?? 0, plays: 0, playsSkipped: 0, profiles: 0, profilesSkipped: 0, end: false, current: false }

  const plays = listPlays()
  for (const p of b.plays) {
    if (plays.some((q) => q.id === p.id || sameBoard(q, p))) { r.playsSkipped++; continue }
    plays.push(p)
    r.plays++
  }
  // La pizarra que estaba abierta se guarda como una jugada más, para no pisar la que está abierta aquí.
  if (hasContent(b.current)) {
    const cur = b.current
    if (!plays.some((q) => sameContent(q.board, cur))) {
      const day = b.created ? new Date(b.created) : new Date()
      const when = isNaN(+day) ? '' : ` (${day.toLocaleDateString('es')})`
      plays.push({ id: `copia-${Date.now().toString(36)}`, name: t('Pizarra abierta') + when, updated: Date.now(), board: cur })
      r.current = true
    }
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
  const damaged = !r.damaged ? '' : ' ' + (r.damaged === 1 ? t('1 jugada estaba dañada y no se importó.') : t('{n} jugadas estaban dañadas y no se importaron.', { n: r.damaged }))
  return describeOk(r) + damaged
}
function describeOk(r: ImportResult) {
  const skipped = r.playsSkipped + r.profilesSkipped
  const same = skipped === 1 ? t('Había 1 elemento que ya tenías y no se ha duplicado.') : t('Había {n} elementos que ya tenías y no se han duplicado.', { n: skipped })
  if (!r.plays && !r.profiles && !r.end && !r.current) return skipped ? t('No había nada nuevo en la copia.') + ' ' + same : r.damaged ? t('No se importó nada.') : t('La copia está vacía.')
  const parts: string[] = []
  if (r.plays) parts.push(r.plays === 1 ? t('1 jugada nueva') : t('{n} jugadas nuevas', { n: r.plays }))
  if (r.current) parts.push(t('la pizarra que tenías abierta'))
  if (r.profiles) parts.push(r.profiles === 1 ? t('1 perfil de Mi identidad') : t('{n} perfiles de Mi identidad', { n: r.profiles }))
  if (r.end && !parts.length) parts.push(t('el mensaje final de los vídeos'))
  return t('Copia importada: {x}.', { x: parts.join(t(' y ')) }) + (skipped ? ' ' + same : '')
}
