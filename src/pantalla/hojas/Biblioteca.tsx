import { EQUIPMENT, type TokenKind } from '../../model'
import { useArt } from '../../material'
import { SESSIONS } from '../../sessions'
import { TEMPLATES } from '../../templates'
import { GROUPS, type Template } from '../../anim'
import { TIPS } from '../../tips'
import { GLOSSARY, LESSONS } from '../../fundamentos'
import { t } from '../../i18n'
import { Sheet } from './Hoja'

// Plantillas agrupadas; ▶ = animadas.
export function TemplatesSheet({ onOpen, onClose }: { onOpen: (tpl: Template) => void; onClose: () => void }) {
  return (
    <Sheet title={t('Plantillas')} onClose={onClose}>
      {GROUPS.map((g) => {
        const list = TEMPLATES.filter((t) => t.group === g.id)
        return (
          <details key={g.id} className="session" open={g.id === 'Bloques'}>
            <summary><b>{g.name}</b><span className="muted small">{list.length}</span></summary>
            <div className="list">
              {list.map((t) => (
                <button key={t.id} className="row" onClick={() => onOpen(t)}>
                  {t.animated && <span className="anim-badge">▶</span>}{t.name}
                </button>
              ))}
            </div>
          </details>
        )
      })}
      <p className="muted small">{t('▶ = jugada animada paso a paso.')}</p>
    </Sheet>
  )
}

// Sesiones sugeridas: cada bloque con ▶ abre su ejercicio.
export function SessionsSheet({ onOpen, onClose }: { onOpen: (tpl: Template) => void; onClose: () => void }) {
  return (
    <Sheet title={t('Sesiones sugeridas')} onClose={onClose}>
      <p className="muted small">{t('Sesiones de fútbol 11 de adultos. MD-3 significa 3 días antes del partido. Toca un bloque con ▶ para abrir su ejercicio animado.')}</p>
      {SESSIONS.map((ses) => (
        <details key={ses.id} className="session">
          <summary>
            <b>{ses.name}</b>
            <span className="muted small">{ses.day} · {ses.blocks.reduce((a, x) => a + x.minutes, 0)} {' '}{t('min')}</span>
          </summary>
          <p className="small">{ses.goal}</p>
          <ol className="blocks">
            {ses.blocks.map((bl, i) => {
              const tpl = TEMPLATES.find((t) => t.id === bl.template)
              return (
                <li key={i}>
                  {tpl ? (
                    <button className="row" onClick={() => onOpen(tpl)}>
                      <span><span className="anim-badge">▶</span><b>{bl.title}</b> · {bl.minutes} {' '}{t('min')}</span>
                      <span className="muted small">{bl.tips}</span>
                    </button>
                  ) : (
                    <div className="row static">
                      <span><b>{bl.title}</b> · {bl.minutes} {' '}{t('min')}</span>
                      <span className="muted small">{bl.tips}</span>
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </details>
      ))}
    </Sheet>
  )
}

// Fundamentos: lecciones con sus jugadas y el diccionario.
export function LearnSheet({ onOpen, onClose }: { onOpen: (tpl: Template, zones?: boolean) => void; onClose: () => void }) {
  return (
    <Sheet title={t('Fundamentos')} onClose={onClose}>
      <p className="muted small">{t('Lo esencial para leer un partido y entender cada jugada de la app. Toca un tema y ábrelo en la pizarra.')}</p>
      {LESSONS.map((l) => (
        <details key={l.id} className="session">
          <summary><b>{l.title}</b><span className="muted small">{l.summary}</span></summary>
          <ul className="tips">
            {l.points.map((pt) => <li key={pt}><span>{pt}</span></li>)}
          </ul>
          {l.templates && (
            <div className="row-actions lesson-links">
              {l.templates.map((id) => TEMPLATES.find((t) => t.id === id)).filter((t) => t !== undefined).map((t) => (
                <button key={t.id} onClick={() => onOpen(t, !!l.zones)}>{t.animated ? '▶ ' : ''}{t.name}</button>
              ))}
            </div>
          )}
        </details>
      ))}
      <details className="session">
        <summary><b>{t('Diccionario')}</b><span className="muted small">{t('Las palabras que más se oyen en análisis y entrenamientos.')}</span></summary>
        <dl className="glossary">
          {GLOSSARY.map(([term, def]) => <div key={term}><dt>{term}</dt><dd>{def}</dd></div>)}
        </dl>
      </details>
    </Sheet>
  )
}

// Consejos de táctica, entrenamiento y gestión del grupo.
export function TipsSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title={t('Consejos')} onClose={onClose}>
      <p className="muted small">{t('Ideas prácticas de táctica, entrenamiento y gestión del grupo, inspiradas en entrenadores de referencia.')}</p>
      {TIPS.map((g) => (
        <details key={g.id} className="session">
          <summary><b>{g.name}</b><span className="muted small">{g.tips.length} {' '}{t('consejos')}</span></summary>
          <ul className="tips">
            {g.tips.map((t) => (
              <li key={t.title}>
                <b>{t.title}</b>
                <span>{t.text}</span>
                {t.source && <span className="muted small">{t.source}</span>}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </Sheet>
  )
}

// Material de entrenamiento para poner en el campo.
export function MaterialSheet({ art, onPick, onClose }: { art: ReturnType<typeof useArt>; onPick: (kind: TokenKind) => void; onClose: () => void }) {
  return (
    <Sheet title={t('Material de entrenamiento')} onClose={onClose}>
      <div className="material">
        {EQUIPMENT.map((e) => (
          <button key={e.kind} onClick={() => onPick(e.kind)}>
            {art?.[`${e.kind}_0`] ? <img src={art[`${e.kind}_0`].u} width="56" height="44" alt="" style={{ objectFit: 'contain' }} /> : <span style={{ height: 44 }} />}
            <span>{e.name}</span>
          </button>
        ))}
      </div>
      <p className="muted small">{t('Toca un elemento para ponerlo en el centro del campo. Luego arrástralo; con el tirador verde lo giras en cualquier dirección y lo agrandas o achicas.')}</p>
    </Sheet>
  )
}
