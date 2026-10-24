import { BRAND_MODES, isIdentityMode, markFor, type BrandMode, type EndCard, type Profile } from '../../identity'
import { IdentityMark } from '../../Pitch'
import { t } from '../../i18n'

// Qué marca se ve abajo a la derecha. Las opciones de siempre (logo, texto, sin marca) siguen igual.
export function BrandPicker({ brandMode, setBrandMode, brand, setBrand, profile }: {
  brandMode: BrandMode
  setBrandMode: (m: BrandMode) => void
  brand: string
  setBrand: (v: string) => void
  profile: Profile | null
}) {
  const m = isIdentityMode(brandMode) ? markFor(brandMode, profile) : null
  return (
    <>
      <label className="pace field-full">
        <span>{t('Se ve')}</span>
        <select value={brandMode} onChange={(e) => setBrandMode(e.target.value as BrandMode)} aria-label={t('Qué marca se ve')}>
          {BRAND_MODES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      {brandMode === 'text' && (
        <label className="field brand">
          <input id="brand" value={brand} maxLength={30} placeholder={t('Escribe tu marca')} onChange={(e) => setBrand(e.target.value)} />
        </label>
      )}
      {isIdentityMode(brandMode) && (
        m ? (
          <svg className="mark-preview" viewBox="0 0 44 8" role="img" aria-label={t('Así se verá abajo a la derecha')}>
            <rect x={0} y={0} width={44} height={8} fill="var(--pitch-out)" />
            <rect x={-1} y={-1} width={42} height={3.2} fill="var(--pitch)" stroke="rgba(255,255,255,.85)" strokeWidth={0.12} />
            <IdentityMark m={m} right={41.5} top={2.6} h={4.4} maxW={34} />
          </svg>
        ) : <p className="muted small">{profile ? t('Rellena los datos de tu perfil para que aparezca.') : t('Todavía no tienes perfil. Pulsa «Crear mi identidad».')}</p>
      )}
      <p className="muted small">{t('Sale pequeña y discreta abajo a la derecha, fuera del campo: en la pizarra, el proyector, las imágenes y los vídeos.')}</p>
    </>
  )
}

// Mensaje final del vídeo. En Exportar la frase se puede cambiar solo para ese vídeo; en Mi identidad se elige la de siempre.
export function EndEditor({ end, setEnd, phrase, setPhrase, perVideo = false, profile }: {
  end: EndCard
  setEnd: (p: Partial<EndCard>) => void
  phrase: string
  setPhrase: (v: string) => void
  perVideo?: boolean
  profile: Profile | null
}) {
  const p = phrase.trim()
  const isFav = end.favorites.includes(p)
  return (
    <div className="endcard">
      <label className="pick">
        <input type="checkbox" checked={end.on} onChange={(e) => setEnd({ on: e.target.checked })} />
        <span>{t('Mensaje final')}{' '}<span className="muted small">{t('pantalla con tu frase, tu escudo y tu nombre al terminar el vídeo')}</span></span>
      </label>
      {end.on && (
        <div className="endcard-body">
          <label className="stack">
            <span className="muted small">{perVideo ? t('Frase de este vídeo') : t('Tu frase de siempre')}</span>
            <textarea rows={2} maxLength={140} value={phrase} placeholder={t('Escribe tu frase o elige una guardada')} onChange={(e) => setPhrase(e.target.value)} />
          </label>
          {perVideo && phrase !== end.phrase && <p className="muted small">{t('Este cambio solo vale para el próximo vídeo. Tu frase de siempre no cambia.')}</p>}
          {!p && <p className="muted small">{t('Sin frase no se añade la pantalla final.')}</p>}
          <div className="favs">
            {end.favorites.map((f) => (
              <span key={f} className={`fav${f === p ? ' on' : ''}`}>
                <button onClick={() => setPhrase(f)}>{f}</button>
                {!perVideo && <button className="x" aria-label={t('Quitar «{f}» de favoritas', { f })} onClick={() => setEnd({ favorites: end.favorites.filter((x) => x !== f) })}>✕</button>}
              </span>
            ))}
          </div>
          {p && !isFav && <button onClick={() => setEnd({ favorites: [...end.favorites, p] })}>{t('★ Guardar en favoritas')}</button>}
          <div className="pace">
            <span>{t('Duración')}</span>
            <div className="seg" role="group" aria-label={t('Duración del mensaje')}>
              {[3, 4, 5].map((n) => <button key={n} className={end.seconds === n ? 'on' : ''} onClick={() => setEnd({ seconds: n })}>{n} {' '}{t('s')}</button>)}
            </div>
          </div>
          <div className="checks">
            {([['crest', t('Escudo')], ['club', t('Equipo')], ['coach', t('Mi nombre')], ['slogan', t('Eslogan')]] as const).map(([k, label]) => (
              <label key={k} className="pick">
                <input type="checkbox" checked={end[k]} onChange={(e) => setEnd({ [k]: e.target.checked })} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {!profile && <p className="muted small">{t('Crea tu perfil en Mi identidad para añadir escudo, equipo y nombre.')}</p>}
        </div>
      )}
    </div>
  )
}
