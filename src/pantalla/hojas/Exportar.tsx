import { useEffect, useRef, useState } from 'react'
import type { Board } from '../../model'
import { TEMPLATES } from '../../templates'
import { GROUPS } from '../../anim'
import { listPlays } from '../../storage'
import { BRAND_MODES, profileLabel, type BrandMode, type EndCard, type Profile } from '../../identity'
import type { ExportOpts, Renderer } from '../../exportVideo'
import { t } from '../../i18n'
import type { VideoOpts } from '../../nucleo/preferencias'
import { Sheet } from './Hoja'
import { BrandPicker, EndEditor } from './Marca'

export function ExportSheet({ hasFrames, brand, setBrand, brandMode, setBrandMode, profile, onIdentity, end, setEnd, phrase, setPhrase, onPreview, onClose, onImage, onVideo, onMany, vopts, setVopts }: {
  vopts: VideoOpts
  setVopts: (p: Partial<VideoOpts>) => void
  hasFrames: boolean
  brand: string
  setBrand: (v: string) => void
  brandMode: BrandMode
  setBrandMode: (m: BrandMode) => void
  profile: Profile | null
  onIdentity: () => void
  end: EndCard
  setEnd: (p: Partial<EndCard>) => void
  phrase: string
  setPhrase: (v: string) => void
  onPreview: () => void
  onClose: () => void
  onImage: () => void
  onVideo: () => void
  onMany: (items: { name: string; board: Board }[]) => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  const plays = listPlays()
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const many = () => onMany(picked.map((id) => {
    const pl = plays.find((p) => p.id === id)
    if (pl) return { name: pl.name, board: pl.board }
    const t = TEMPLATES.find((x) => x.id === id)!
    return { name: t.name, board: t.build() }
  }))
  const Item = ({ id, label, anim }: { id: string; label: string; anim: boolean }) => (
    <label className="pick">
      <input type="checkbox" checked={picked.includes(id)} onChange={() => toggle(id)} />
      <span>{anim && <span className="anim-badge">▶</span>}{label}</span>
    </label>
  )
  return (
    <Sheet title={t('Exportar')} onClose={onClose}>
      <section>
        <h3>{t('Esta pizarra')}</h3>
        <div className="row-actions">
          <button onClick={onImage}>{t('Imagen PNG')}</button>
          <button onClick={onVideo} disabled={!hasFrames}>{t('Vídeo MP4')}</button>
          <button onClick={onPreview} disabled={!hasFrames}>{t('Vista previa')}</button>
        </div>
        {!hasFrames && <p className="muted small">{t('El vídeo y la vista previa necesitan una jugada con pasos (pulsa + Paso).')}</p>}
      </section>
      <section>
        <h3>{t('Mi identidad')}</h3>
        <BrandPicker brandMode={brandMode} setBrandMode={setBrandMode} brand={brand} setBrand={setBrand} profile={profile} />
        <button className="wide" onClick={onIdentity}>{profile ? t('Editar mi identidad · {p}', { p: profileLabel(profile) }) : t('Crear mi identidad')}</button>
      </section>
      <section>
        <h3>{t('Opciones del vídeo')}</h3>
        <label className="pick">
          <input type="checkbox" checked={vopts.big} onChange={(e) => setVopts({ big: e.target.checked })} />
          <span>{t('Letra grande')}{' '}<span className="muted small">{t('para verlo en el móvil, WhatsApp o redes')}</span></span>
        </label>
        <label className="pick">
          <input type="checkbox" checked={!!vopts.full} onChange={(e) => setVopts({ full: e.target.checked })} />
          <span>{t('Campo a todo el ancho')}{' '}<span className="muted small">{t('el vídeo sale más alto que una pantalla panorámica')}</span></span>
        </label>
        <EndEditor end={end} setEnd={setEnd} phrase={phrase} setPhrase={setPhrase} perVideo profile={profile} />
        <label className="pick">
          <input type="checkbox" checked={vopts.outro} onChange={(e) => setVopts({ outro: e.target.checked })} />
          <span>{t('Cierre con el logo de TacticalPro')}{' '}<span className="muted small">{t('Aprende · Planifica · Entrena')}</span></span>
        </label>
      </section>
      <section>
        <h3>{t('Varias a la vez')}</h3>
        <p className="muted small">{t('Marca las que quieras. Las animadas salen en vídeo y las demás en imagen.')}</p>
        {plays.length > 0 && (
          <details className="session" open>
            <summary><b>{t('Mis jugadas')}</b><span className="muted small">{plays.length}</span></summary>
            <div className="picklist">{plays.map((p) => <Item key={p.id} id={p.id} label={p.name} anim={!!p.board.frames} />)}</div>
          </details>
        )}
        {GROUPS.map((g) => {
          const list = TEMPLATES.filter((t) => t.group === g.id)
          return (
            <details key={g.id} className="session">
              <summary><b>{g.name}</b><span className="muted small">{list.filter((t) => picked.includes(t.id)).length || ''} {list.length}</span></summary>
              <div className="picklist">{list.map((t) => <Item key={t.id} id={t.id} label={t.name} anim={!!t.animated} />)}</div>
            </details>
          )
        })}
        <button className="primary wide" disabled={!picked.length} onClick={many}>
          {picked.length ? (picked.length > 1 ? t('Exportar {n} seleccionadas', { n: picked.length }) : t('Exportar 1 seleccionada')) : t('Elige al menos una')}
        </button>
      </section>
      <p className="muted small">{t('Versión')}{' '}{__BUILD__}</p>
    </Sheet>
  )
}

// Vista previa: el mismo dibujo que el vídeo, en tiempo real. Si cambias una opción, se actualiza sin volver al principio.
export function Preview({ board, opts, vopts, setVopts, end, setEnd, brandMode, setBrandMode, onClose, onExport }: {
  board: Board
  opts: ExportOpts
  vopts: VideoOpts
  setVopts: (p: Partial<VideoOpts>) => void
  end: EndCard
  setEnd: (p: Partial<EndCard>) => void
  brandMode: BrandMode
  setBrandMode: (m: BrandMode) => void
  onClose: () => void
  onExport: () => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const clock = useRef({ t: 0, at: performance.now() })
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const [info, setInfo] = useState({ t: 0, total: 0 })
  const rend = useRef<Renderer | null>(null)
  const now = () => (pausedRef.current ? clock.current.t : clock.current.t + (performance.now() - clock.current.at) / 1000)
  const seek = (t: number) => { clock.current = { t, at: performance.now() } }
  useEffect(() => {
    let alive = true
    let busy = false
    let id = 0
    ;(async () => {
      const ex = await import('../../exportVideo')
      const r = await ex.videoRenderer(board, opts, canvas.current!)
      if (!alive) return
      rend.current = r
      const tick = async () => {
        if (!alive) return
        if (!busy) {
          busy = true
          let t = now()
          // Al terminar vuelve a empezar tras un segundo.
          if (t > r.seconds + 1) { seek(0); t = 0 }
          await r.draw(Math.min(t, r.seconds - 0.001))
          setInfo({ t: Math.min(t, r.seconds), total: r.seconds })
          busy = false
        }
        id = requestAnimationFrame(tick)
      }
      tick()
    })()
    return () => { alive = false; cancelAnimationFrame(id) }
  }, [board, opts])
  const toggle = () => {
    const t = now()
    pausedRef.current = !pausedRef.current
    seek(t)
    setPaused(pausedRef.current)
  }
  const fmt = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`
  return (
    <div className="preview" role="dialog" aria-label={t('Vista previa del vídeo')}>
      <div className={`preview-frame${opts.vertical ? ' vertical' : ''}`}><canvas ref={canvas} width={1280} height={720} /></div>
      <div className="preview-bar">
        <button className="primary" onClick={toggle}>{paused ? t('▶ Seguir') : t('❚❚ Pausa')}</button>
        <button onClick={() => seek(0)}>{t('⟲ Inicio')}</button>
        <button onClick={() => seek(Math.max(0, (rend.current?.animSeconds ?? 0) - 1.5))} disabled={!end.on && !vopts.outro}>{t('Ver el final')}</button>
        <span className="muted small time">{fmt(info.t)} / {fmt(info.total)}</span>
      </div>
      <div className="preview-opts">
        <label className="pick"><input type="checkbox" checked={vopts.big} onChange={(e) => setVopts({ big: e.target.checked })} /><span>{t('Letra grande')}</span></label>
        {!opts.vertical && <label className="pick"><input type="checkbox" checked={!!vopts.full} onChange={(e) => setVopts({ full: e.target.checked })} /><span>{t('Campo a todo el ancho')}</span></label>}
        <label className="pick"><input type="checkbox" checked={end.on} onChange={(e) => setEnd({ on: e.target.checked })} /><span>{t('Mensaje final')}</span></label>
        <label className="pick"><input type="checkbox" checked={vopts.outro} onChange={(e) => setVopts({ outro: e.target.checked })} /><span>{t('Cierre TacticalPro')}</span></label>
        <label className="pace">
          <span>{t('Marca')}</span>
          <select value={brandMode} onChange={(e) => setBrandMode(e.target.value as BrandMode)} aria-label={t('Qué marca se ve')}>
            {BRAND_MODES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      </div>
      <div className="preview-bar">
        <button onClick={onClose}>{t('Volver')}</button>
        <button className="primary" onClick={onExport}>{t('Exportar vídeo MP4')}</button>
      </div>
    </div>
  )
}
