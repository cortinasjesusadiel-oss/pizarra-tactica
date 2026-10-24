import { useRef, useState } from 'react'
import { ROLES, isIdentityMode, newProfile, profileLabel, readCrest, type BrandMode, type EndCard, type IdentityStore, type Profile } from '../../identity'
import { t } from '../../i18n'
import { Sheet } from './Hoja'
import { BrandPicker, EndEditor } from './Marca'

export function IdentitySheet({ store, setStore, brandMode, setBrandMode, brand, setBrand, end, setEnd, onError, onClose }: {
  store: IdentityStore
  setStore: (f: (s: IdentityStore) => IdentityStore) => void
  brandMode: BrandMode
  setBrandMode: (m: BrandMode) => void
  brand: string
  setBrand: (v: string) => void
  end: EndCard
  setEnd: (p: Partial<EndCard>) => void
  onError: (msg: string) => void
  onClose: () => void
}) {
  const p = store.profiles.find((x) => x.id === store.active) ?? null
  const [confirm, setConfirm] = useState(false)
  const [otherRole, setOtherRole] = useState(() => !!p && !ROLES.includes(p.role))
  const file = useRef<HTMLInputElement>(null)
  const update = (patch: Partial<Profile>) => setStore((s) => ({ ...s, profiles: s.profiles.map((x) => (x.id === s.active ? { ...x, ...patch } : x)) }))
  const pick = (id: string) => {
    setStore((s) => ({ ...s, active: id }))
    const q = store.profiles.find((x) => x.id === id)
    setOtherRole(!!q && !ROLES.includes(q.role))
    setConfirm(false)
  }
  const add = () => {
    const q = newProfile()
    setStore((s) => ({ profiles: [...s.profiles, q], active: q.id }))
    setOtherRole(false)
    setConfirm(false)
    if (!isIdentityMode(brandMode)) setBrandMode('full')
  }
  const remove = () => {
    setStore((s) => {
      const profiles = s.profiles.filter((x) => x.id !== s.active)
      return { profiles, active: profiles[0]?.id ?? null }
    })
    setConfirm(false)
  }
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try { update(await readCrest(f)) } catch (err) { onError(err instanceof Error ? err.message : t('No se pudo leer la imagen')) }
  }
  return (
    <Sheet title={t('Mi identidad')} onClose={onClose}>
      <p className="muted small">{t('Tu nombre, tu equipo y tu escudo en tus pizarras, imágenes y vídeos. Se guarda solo en este dispositivo: sin cuenta y sin internet.')}</p>
      <section>
        <h3>{t('Perfiles')}</h3>
        <div className="chips-row">
          {store.profiles.map((x) => (
            <button key={x.id} className={x.id === store.active ? 'on' : ''} onClick={() => pick(x.id)}>{profileLabel(x)}</button>
          ))}
          <button className="primary" onClick={add}>{t('+ Nuevo perfil')}</button>
        </div>
      </section>
      {p && (
        <section className="idform">
          <label className="stack">
            <span className="muted small">{t('Nombre del entrenador')}</span>
            <input id="id-coach" value={p.coach} maxLength={60} placeholder={t('Ej.: Jesús Cortinas')} onChange={(e) => update({ coach: e.target.value })} />
          </label>
          <label className="stack">
            <span className="muted small">{t('Cargo')}</span>
            <select id="id-role" value={otherRole ? 'otro' : p.role} onChange={(e) => {
              if (e.target.value === 'otro') { setOtherRole(true); update({ role: '' }) } else { setOtherRole(false); update({ role: e.target.value }) }
            }}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              <option value="otro">{t('Otro…')}</option>
            </select>
          </label>
          {otherRole && <input id="id-role-other" value={p.role} maxLength={40} placeholder={t('Escribe tu cargo')} onChange={(e) => update({ role: e.target.value })} />}
          <label className="stack">
            <span className="muted small">{t('Club, equipo o escuela')}</span>
            <input id="id-club" value={p.club} maxLength={60} placeholder={t('Ej.: Semillas Tuluá FC')} onChange={(e) => update({ club: e.target.value })} />
          </label>
          <div className="stack">
            <span className="muted small">{t('Escudo (PNG, JPG o WebP)')}</span>
            <div className="crest-row">
              {p.crest ? <img className="crest" src={p.crest} alt={t('Escudo')} /> : <span className="crest empty">{t('Sin escudo')}</span>}
              <button onClick={() => file.current?.click()}>{p.crest ? t('Cambiar') : t('Subir escudo')}</button>
              {p.crest && <button onClick={() => update({ crest: undefined, crestRatio: undefined })}>{t('Quitar')}</button>}
              <input ref={file} id="id-crest" type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
            </div>
            <span className="muted small">{t('Mejor en PNG con fondo transparente. Se respeta la forma y la transparencia.')}</span>
          </div>
          <label className="stack">
            <span className="muted small">{t('Eslogan (opcional)')}</span>
            <input id="id-slogan" value={p.slogan} maxLength={80} placeholder={t('Ej.: Formamos personas, formamos futbolistas')} onChange={(e) => update({ slogan: e.target.value })} />
          </label>
          {confirm ? (
            <div className="row-actions">
              <button className="danger" onClick={remove}>{t('Sí, eliminar «{p}»', { p: profileLabel(p) })}</button>
              <button onClick={() => setConfirm(false)}>{t('Cancelar')}</button>
            </div>
          ) : <button onClick={() => setConfirm(true)}>{t('Eliminar este perfil')}</button>}
        </section>
      )}
      {!p && <p className="muted">{t('Crea tu primer perfil con «+ Nuevo perfil». Ningún dato es obligatorio.')}</p>}
      <section>
        <h3>{t('Qué se ve')}</h3>
        <BrandPicker brandMode={brandMode} setBrandMode={setBrandMode} brand={brand} setBrand={setBrand} profile={p} />
      </section>
      <section>
        <h3>{t('Mensaje final del vídeo')}</h3>
        <EndEditor end={end} setEnd={setEnd} phrase={end.phrase} setPhrase={(v) => setEnd({ phrase: v })} profile={p} />
      </section>
      <p className="muted small">{t('La marca de TacticalPro y la tuya van por separado: durante la jugada solo se ve la tuya y el logo de TacticalPro sale en un cierre breve al final, que puedes quitar al exportar.')}</p>
    </Sheet>
  )
}
