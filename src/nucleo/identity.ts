import { t, tr } from '../i18n'
// «Mi identidad»: el nombre del entrenador, su cargo, su club con escudo y eslogan, y el mensaje final de los vídeos.
// Todo se guarda en este dispositivo (sin cuenta ni conexión). Se pueden tener varios perfiles y cambiar entre ellos.

export interface Profile {
  id: string
  coach: string
  role: string
  club: string
  slogan: string
  // Escudo como imagen incrustada (data URL), ya reducido para que ocupe poco. Mantiene la transparencia.
  crest?: string
  crestRatio?: number // ancho / alto del escudo
}

// Qué se ve en la pizarra, las imágenes y los vídeos. 'logo', 'text' y 'none' son las opciones de siempre.
export type BrandMode = 'logo' | 'text' | 'none' | 'coach' | 'crest' | 'crestClub' | 'crestClubSlogan' | 'full'

export const BRAND_MODES: { id: BrandMode; name: string }[] = [
  { id: 'coach', name: t('Mi nombre') },
  { id: 'crest', name: t('Solo escudo') },
  { id: 'crestClub', name: t('Escudo y equipo') },
  { id: 'crestClubSlogan', name: t('Escudo, equipo y eslogan') },
  { id: 'full', name: t('Identidad completa') },
  { id: 'logo', name: t('Logo Jesús Cortinas') },
  { id: 'text', name: t('Texto libre') },
  { id: 'none', name: t('Sin marca') },
]

export const ROLES = [t('Entrenador'), t('Analista Táctico'), t('Director Técnico')]

export interface EndCard {
  on: boolean
  phrase: string
  favorites: string[]
  seconds: number // de 3 a 5
  crest: boolean
  club: boolean
  slogan: boolean
  coach: boolean
}

export const DEFAULT_END: EndCard = {
  on: false,
  phrase: '',
  favorites: [
    t('La disciplina de hoy construye las victorias de mañana.'),
    t('Un equipo unido siempre encuentra el camino.'),
    t('Entrenamos juntos. Crecemos juntos. Competimos juntos.'),
  ],
  seconds: 4,
  crest: true,
  club: true,
  slogan: false,
  coach: true,
}

// Lo que hace falta para dibujar la marca: escudo (si se muestra) y líneas de texto, de arriba abajo.
export type LineKind = 'club' | 'coach' | 'slogan'
export interface Mark { crest?: string; crestRatio: number; lines: { kind: LineKind; text: string }[] }

export const coachLine = (p: Profile) => [p.coach.trim(), tr(p.role.trim())].filter(Boolean).join(' — ')

export function markFor(mode: BrandMode, p: Profile | null): Mark | null {
  if (!p) return null
  const text: Record<LineKind, string> = { club: p.club.trim(), coach: coachLine(p), slogan: p.slogan.trim() }
  const m = (withCrest: boolean, kinds: LineKind[]): Mark | null => {
    const lines = kinds.filter((k) => text[k]).map((kind) => ({ kind, text: text[kind] }))
    const crest = withCrest ? p.crest : undefined
    return crest || lines.length ? { crest, crestRatio: p.crestRatio ?? 1, lines } : null
  }
  switch (mode) {
    case 'coach': return m(false, ['coach'])
    // Sin escudo subido, se pone el nombre del equipo para que no quede vacío.
    case 'crest': return m(true, p.crest ? [] : ['club'])
    case 'crestClub': return m(true, ['club'])
    case 'crestClubSlogan': return m(true, ['club', 'slogan'])
    case 'full': return m(true, ['club', 'coach', 'slogan'])
    default: return null
  }
}

// Lo que sale en la pantalla final del vídeo.
export interface EndView { phrase: string; crest?: string; crestRatio: number; club: string; coach: string; slogan: string; seconds: number }

export function endFor(e: EndCard, p: Profile | null, phrase: string): EndView | null {
  if (!e.on || !phrase.trim()) return null
  return {
    phrase: phrase.trim(),
    crest: e.crest ? p?.crest : undefined,
    crestRatio: p?.crestRatio ?? 1,
    club: e.club ? p?.club.trim() ?? '' : '',
    coach: e.coach && p ? coachLine(p) : '',
    slogan: e.slogan ? p?.slogan.trim() ?? '' : '',
    seconds: Math.max(3, Math.min(5, e.seconds)),
  }
}

export const isIdentityMode = (m: BrandMode) => !['logo', 'text', 'none'].includes(m)

// ---------- Guardado ----------

const KEY = 'pizarra.identidad.v1'
const END_KEY = 'pizarra.mensaje.v1'

export interface IdentityStore { profiles: Profile[]; active: string | null }

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? { ...fallback, ...JSON.parse(raw) } : fallback } catch { return fallback }
}
// Devuelve false si no se pudo guardar (por ejemplo, almacenamiento lleno).
function write(key: string, v: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(v)); return true } catch { return false }
}

export const loadIdentity = () => read<IdentityStore>(KEY, { profiles: [], active: null })
export const saveIdentity = (s: IdentityStore) => write(KEY, s)
export const loadEnd = () => read<EndCard>(END_KEY, DEFAULT_END)
export const saveEnd = (e: EndCard) => write(END_KEY, e)

export const newProfile = (): Profile => ({ id: `p${Date.now().toString(36)}`, coach: '', role: t('Entrenador'), club: '', slogan: '' })

export const profileLabel = (p: Profile) => p.club.trim() || coachLine(p) || t('Perfil sin nombre')

// ---------- Escudo ----------

// Lee la imagen elegida (PNG, JPG o WebP) y la reduce a un máximo de 512 px por lado sin deformarla.
// Se guarda en PNG si tiene transparencia y en WebP si no, para que pese poco y se vea nítida.
export async function readCrest(file: File): Promise<{ crest: string; crestRatio: number }> {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error(t('Formato no admitido: usa PNG, JPG o WebP'))
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const w0 = img.naturalWidth, h0 = img.naturalHeight
    if (!w0 || !h0) throw new Error(t('La imagen está vacía'))
    const k = Math.min(1, 512 / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k))
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, w, h)
    let alpha = false
    if (file.type !== 'image/jpeg') {
      const d = ctx.getImageData(0, 0, w, h).data
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) { alpha = true; break }
    }
    const webp = c.toDataURL('image/webp', 0.9)
    const crest = alpha ? c.toDataURL('image/png') : webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', 0.9)
    return { crest, crestRatio: w / h }
  } finally {
    URL.revokeObjectURL(url)
  }
}
