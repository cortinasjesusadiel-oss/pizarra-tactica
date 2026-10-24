import { KIND_NAME, type Team, type Token } from '../../nucleo/model'
import { t } from '../../i18n'

// Barra de la ficha elegida: dorsal, nombre y equipo del jugador; girar y tamaño del material; eliminar.
export function SelBar({ sel, updateSel, removeSelected }: { sel: Token; updateSel: (patch: Partial<Token>) => void; removeSelected: () => void }) {
  return (
    <div className="selbar">
      <span className="muted">{KIND_NAME(sel.kind)}</span>
      {sel.kind === 'player' && (
        <>
          <label className="field">
            {t('Dorsal')}
            <input id="dorsal" value={sel.label} maxLength={3} onChange={(e) => updateSel({ label: e.target.value.toUpperCase() })} />
          </label>
          <label className="field">
            {t('Nombre')}
            <input id="nombre" className="name-input" value={sel.name ?? ''} maxLength={14} placeholder={t('Opcional')} onChange={(e) => updateSel({ name: e.target.value })} />
          </label>
          <div className="seg" role="group" aria-label={t('Equipo')}>
            {(['home', 'away', 'neutral'] as Team[]).map((tm) => (
              <button key={tm} className={sel.team === tm ? 'on' : ''} onClick={() => updateSel({ team: tm })}>
                {tm === 'home' ? t('Local') : tm === 'away' ? t('Rival') : t('Comodín')}
              </button>
            ))}
          </div>
        </>
      )}
      {sel.kind !== 'player' && sel.kind !== 'ball' && (<>
        <button onClick={() => updateSel({ rot: ((sel.rot ?? 0) + 45) % 360 })}>{t('Girar 45°')}</button>
        <button onClick={() => updateSel({ size: Math.max(0.4, +((sel.size ?? 1) - 0.2).toFixed(2)) })} aria-label={t('Más pequeño')} title={t('Más pequeño')}>−</button>
        <button onClick={() => updateSel({ size: Math.min(2.5, +((sel.size ?? 1) + 0.2).toFixed(2)) })} aria-label={t('Más grande')} title={t('Más grande')}>+</button>
      </>)}
      <button className="danger" onClick={removeSelected}>{t('Eliminar')}</button>
    </div>
  )
}
