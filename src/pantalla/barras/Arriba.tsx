import { useCallback, useEffect, useState } from 'react'
import { PITCH, type Board, type PitchKind, type TokenKind } from '../../nucleo/model'
import tpSymbol from '../../tpSymbol.png'
import { t } from '../../i18n'
import { useCerrarAlGirar, type SheetId } from './comun'

// Nombre corto del campo para el botón de la barra de arriba.
const pitchName = (k: PitchKind) => (k === 'full' ? t('Campo') : k === 'half' ? t('Medio') : '40×30')

// Barra de arriba: nueva pizarra, campo y vista, biblioteca, añadir fichas, deshacer y exportar.
export function TopBar({ board, side, zones, toggleZones, newBoard, setPitch, addToken, undo, redo, canUndo, canRedo, openPresent, setSheet }: {
  board: Board
  side: boolean
  zones: boolean
  toggleZones: () => void
  newBoard: () => void
  setPitch: (k: PitchKind) => void
  addToken: (kind: 'home' | 'away' | TokenKind) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  openPresent: () => void
  setSheet: (s: SheetId) => void
}) {
  // Menús de la barra de arriba (campo y vista, biblioteca).
  const [topMenu, setTopMenu] = useState<{ id: 'pitch' | 'library' | 'more'; rect: DOMRect } | null>(null)
  const openTopMenu = (id: 'pitch' | 'library' | 'more', el: HTMLElement) => setTopMenu(topMenu?.id === id ? null : { id, rect: el.getBoundingClientRect() })
  useEffect(() => {
    if (!topMenu) return
    const close = (e: PointerEvent) => { if (!(e.target as Element).closest?.('.tool-menu, .top-group')) setTopMenu(null) }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [topMenu])
  useCerrarAlGirar(useCallback(() => setTopMenu(null), []))

  return (
    <>
      <header className="top">
        <strong className="brand"><img src={tpSymbol} alt="" />{t('Tactical')}<span>{t('Pro')}</span></strong>
        <button className="primary" onClick={newBoard}>{t('+ Nueva')}</button>
        {/* La barra de arriba se agrupa en dos menús para que quepa en el móvil sin desplazarse. */}
        <button className={`top-group${topMenu?.id === 'pitch' ? ' open' : ''}`} aria-haspopup="menu" aria-expanded={topMenu?.id === 'pitch'}
          onClick={(e) => openTopMenu('pitch', e.currentTarget)}>{pitchName(board.pitch)} ▾</button>
        <button className={`top-group${topMenu?.id === 'library' ? ' open' : ''}`} aria-haspopup="menu" aria-expanded={topMenu?.id === 'library'}
          onClick={(e) => openTopMenu('library', e.currentTarget)}>{t('Biblioteca')} ▾</button>
        {/* En el móvil la barra va en dos filas, sin nada escondido fuera de la pantalla: lo menos usado pasa a «Más». */}
        <button className={`top-group narrow-only${topMenu?.id === 'more' ? ' open' : ''}`} aria-haspopup="menu" aria-expanded={topMenu?.id === 'more'}
          onClick={(e) => openTopMenu('more', e.currentTarget)}>{t('Más')} ▾</button>
        <span className="row-break narrow-only" />
        <span className="sep" />
        <button className="chip home half" onClick={() => addToken('home')} aria-label={t('Añadir jugador local')}>{t('+ Local')}</button>
        <button className="chip away half" onClick={() => addToken('away')} aria-label={t('Añadir jugador rival')}>{t('+ Rival')}</button>
        <button onClick={() => addToken('ball')}>{t('+ Balón')}</button>
        <button className="wide-only" onClick={() => setSheet('material')}>{t('+ Material')}</button>
        <span className="sep" />
        <button className="half" onClick={undo} disabled={!canUndo} aria-label={t('Deshacer')}>↶</button>
        <button className="half" onClick={redo} disabled={!canRedo} aria-label={t('Rehacer')}>↷</button>
        <button className="wide-only" onClick={() => setSheet('plays')}>{t('Jugadas')}</button>
        <button className="wide-only" onClick={openPresent}>{t('Proyectar')}</button>
        <button onClick={() => setSheet('export')}>{t('Exportar')}</button>
      </header>
      {topMenu && (
        <div className="tool-menu" role="menu" aria-label={topMenu.id === 'pitch' ? t('Campo y vista') : topMenu.id === 'more' ? t('Más') : t('Biblioteca')}
          style={side
            // Móvil de lado: el menú está en la columna izquierda, así que se abre hacia la derecha, sobre el campo.
            ? { left: topMenu.rect.right + 6, top: Math.max(8, Math.min(topMenu.rect.top, window.innerHeight - 330)), maxHeight: window.innerHeight - 8 - Math.max(8, Math.min(topMenu.rect.top, window.innerHeight - 330)), overflowY: 'auto' }
            : { left: Math.max(8, Math.min(topMenu.rect.left, window.innerWidth - 240)), top: topMenu.rect.bottom + 6 }}>
          {topMenu.id === 'pitch' ? (<>
            <div className="tool-menu-title">{t('Tipo de campo')}</div>
            {(Object.keys(PITCH) as PitchKind[]).map((k) => (
              <button key={k} role="menuitemradio" aria-checked={board.pitch === k} className={board.pitch === k ? 'on' : ''}
                onClick={() => { setPitch(k); setTopMenu(null) }}>{PITCH[k].name}</button>
            ))}
            <div className="tool-menu-title">{t('Vista')}</div>
            <button role="menuitemcheckbox" aria-checked={zones} className={zones ? 'on' : ''} onClick={() => { toggleZones(); setTopMenu(null) }}>{zones ? '✓ ' : ''}{t('Zonas')}</button>
            <button role="menuitem" onClick={() => { setSheet('look'); setTopMenu(null) }}>{t('Fichas')}</button>
          </>) : topMenu.id === 'more' ? (<>
            <button role="menuitem" onClick={() => { setSheet('plays'); setTopMenu(null) }}>{t('Jugadas')}</button>
            <button role="menuitem" onClick={() => { openPresent(); setTopMenu(null) }}>{t('Proyectar')}</button>
            <button role="menuitem" onClick={() => { setSheet('material'); setTopMenu(null) }}>{t('+ Material')}</button>
          </>) : (<>
            <div className="tool-menu-title">{t('Biblioteca')}</div>
            <button role="menuitem" onClick={() => { setSheet('templates'); setTopMenu(null) }}>{t('Plantillas')}</button>
            <button role="menuitem" onClick={() => { setSheet('sessions'); setTopMenu(null) }}>{t('Sesiones')}</button>
            <button role="menuitem" onClick={() => { setSheet('learn'); setTopMenu(null) }}>{t('Fundamentos')}</button>
            <button role="menuitem" onClick={() => { setSheet('tips'); setTopMenu(null) }}>{t('Consejos')}</button>
          </>)}
        </div>
      )}
    </>
  )
}
