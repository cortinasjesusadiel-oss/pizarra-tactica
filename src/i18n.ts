// Idiomas de la app: español (el original) e inglés.
// Los textos se escriben en español en el código y `t()` devuelve su traducción si la app está en inglés.
// El idioma se elige al arrancar; al cambiarlo se recarga la app para que todo salga en el idioma nuevo.
import EN from './lang/en.json'

export type Lang = 'es' | 'en'
const KEY = 'pizarra.idioma'

function detect(): Lang {
  try {
    // La web abre la pizarra con ?lang=es o ?lang=en: ese idioma se guarda y se quita de la dirección.
    const q = new URLSearchParams(location.search).get('lang')
    if (q === 'es' || q === 'en') {
      try { localStorage.setItem(KEY, q) } catch { /* sin almacenamiento: vale para esta vez */ }
      const u = new URL(location.href)
      u.searchParams.delete('lang')
      history.replaceState(history.state, '', u.pathname + u.search + u.hash)
      return q
    }
  } catch { /* sin almacenamiento */ }
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch { /* sin almacenamiento */ }
  const nav = typeof navigator !== 'undefined' ? navigator.languages?.[0] ?? navigator.language ?? 'es' : 'es'
  return /^es\b/i.test(nav) ? 'es' : 'en'
}

export const lang: Lang = detect()
if (typeof document !== 'undefined') document.documentElement.lang = lang

const en = EN as Record<string, string>
let es: Record<string, string> | null = null
const toEs = () => es ?? (es = Object.fromEntries(Object.entries(en).map(([k, v]) => [v, k])))

// Traduce un texto. Los valores entre llaves se rellenan: t('Paso {n}', { n: 3 }).
// Si una palabra significa cosas distintas según el sitio, se le pone delante el contexto: t('zona|Central').
export function t(s: string, vars?: Record<string, string | number>): string {
  const base = s.includes('|') ? s.slice(s.indexOf('|') + 1) : s
  let out = lang === 'en' ? en[s] ?? base : base
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v))
  return out
}

// Para textos guardados (notas de los pasos, cargos…): se muestran en el idioma actual aunque se guardaran en el otro.
export function tr(s: string): string {
  if (!s) return s
  return lang === 'en' ? en[s] ?? s : toEs()[s] ?? s
}

export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l) } catch { /* sin almacenamiento */ }
  location.reload()
}
