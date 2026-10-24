import { GUIDE_MANUAL, GUIDE_STEPS, type GuideSection } from '../../guia'
import { lang, t } from '../../i18n'
import { Sheet } from './Hoja'

// Una sección de la guía de uso: título desplegable, explicación, captura y puntos.
export function GuideBlock({ s, label, open = false }: { s: GuideSection; label?: string; open?: boolean }) {
  return (
    <details className="session guide" open={open}>
      <summary><b>{label ? `${label} · ${s.title}` : s.title}</b></summary>
      {s.intro && <p className="small">{s.intro}</p>}
      {s.img && <a href={`guia/${lang}/${s.img}.webp`} target="_blank" rel="noopener" aria-label={t('Ver la imagen en grande')}><img className="guide-img" loading="lazy" src={`guia/${lang}/${s.img}.webp`} alt="" /></a>}
      <ul className="guide-list">
        {s.items.map((it) => <li key={it.text}>{it.term && <b>{it.term}: </b>}{it.text}</li>)}
      </ul>
    </details>
  )
}

// Ayuda: guía de uso y contacto.
export function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title={t('Ayuda y sugerencias')} onClose={onClose}>
      <h3 className="guide-h">{t('Crea tu primera jugada')}</h3>
      <p className="muted small">{t('En cinco pasos, de la pizarra vacía a un vídeo para tu equipo.')}</p>
      {GUIDE_STEPS.map((s, i) => <GuideBlock key={s.id} s={s} label={t('Paso {n}', { n: i + 1 })} open={i === 0} />)}
      <h3 className="guide-h">{t('Manual por funciones')}</h3>
      <p className="muted small">{t('Consulta qué hace cada botón cuando lo necesites.')}</p>
      {GUIDE_MANUAL.map((s) => <GuideBlock key={s.id} s={s} />)}
      <a className="help-link guide-web" href={lang === 'en' ? 'https://tacticalpro.app/en/guide.html' : 'https://tacticalpro.app/guia.html'} target="_blank" rel="noopener">{t('Ver la guía con imágenes en la web')}</a>
      <h3 className="guide-h">{t('¿Dudas o ideas?')}</h3>
      <p className="muted">{t('¿Tienes una duda, has encontrado un fallo o se te ocurre una mejora? Escríbenos, nos ayuda mucho a mejorar TacticalPro.')}</p>
      <div className="help-links">
        <a className="help-link wa" href={'https://wa.me/34624981522?text=' + encodeURIComponent(t('Hola, tengo una consulta sobre TacticalPro'))} target="_blank" rel="noopener">{t('Escríbenos por WhatsApp')}</a>
        <a className="help-link" href={'mailto:tacticalproapp@gmail.com?subject=' + encodeURIComponent(t('Consulta sobre TacticalPro'))}>{t('Enviar un correo')}</a>
        <a className="help-link wa" href="https://chat.whatsapp.com/GNTKc18jNMfBGGpIKfLkJL" target="_blank" rel="noopener">{t('Únete a TacticalPro · Comunidad')}</a>
        <a className="help-link" href={lang === 'en' ? 'https://tacticalpro.app/en/#opinion' : 'https://tacticalpro.app/#opinion'} target="_blank" rel="noopener">{t('Danos tu opinión')}</a>
      </div>
      <p className="muted small">{t('Un espacio para aprender y compartir sobre táctica, análisis y entrenamiento de fútbol. Abierto a todos los roles y niveles.')}</p>
      <p className="muted small">tacticalproapp@gmail.com</p>
    </Sheet>
  )
}
