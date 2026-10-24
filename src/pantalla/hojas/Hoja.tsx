import { t } from '../../i18n'

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button onClick={onClose}>{t('Cerrar')}</button>
        </div>
        {children}
      </div>
    </div>
  )
}
