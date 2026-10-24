import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { COLORS, DEFAULT_COLOR, TOOL_NAME, type DrawTool, type Tool } from '../../nucleo/model'
import { lang, setLang, t } from '../../i18n'
import { useCerrarAlGirar, type SheetId } from './comun'
import { ToolIcon } from './iconos'

// Barra de herramientas agrupada: cada grupo es un botón que despliega sus herramientas.
const TOOL_GROUPS: { id: string; name: string; tools: DrawTool[] }[] = [
  { id: 'pases', name: t('Pases'), tools: ['pass', 'lob', 'shot'] },
  { id: 'mov', name: t('Movimientos'), tools: ['run', 'dribble', 'press'] },
  { id: 'lineas', name: t('Flechas y líneas'), tools: ['arrow', 'darrow', 'line', 'dline', 'free'] },
  { id: 'marcar', name: t('Marcar'), tools: ['text', 'zone', 'focus'] },
]

// Barra de herramientas (abajo, o a la derecha con el móvil de lado): herramienta, color del trazo y ajustes generales.
export function ToolBar({ tool, pickTool, side, color, setColor, activeDraw, penSeen, clearDrawings, canClear, vertical, toggleVertical, setSheet }: {
  tool: Tool
  pickTool: (t: Tool) => void
  side: boolean
  color: string | null
  setColor: (c: string) => void
  activeDraw: DrawTool
  penSeen: boolean
  clearDrawings: () => void
  canClear: boolean
  vertical: boolean
  toggleVertical: () => void
  setSheet: (s: SheetId) => void
}) {
  // Última herramienta usada de cada grupo (es la que muestra su botón) y el menú abierto.
  const [groupPick, setGroupPick] = useState<Record<string, DrawTool>>(() => Object.fromEntries(TOOL_GROUPS.map((g) => [g.id, g.tools[0]])))
  const [menu, setMenu] = useState<{ id: string; rect: DOMRect } | null>(null)
  useEffect(() => {
    if (!menu) return
    const close = (e: PointerEvent) => { if (!(e.target as Element).closest?.('.tool-menu, .tool-group')) setMenu(null) }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [menu])
  useCerrarAlGirar(useCallback(() => setMenu(null), []))

  return (
      <footer className="tools">
        <div className="seg big" role="group" aria-label={t('Herramienta')}>
          <button className={tool === 'move' ? 'on' : ''} onClick={() => { pickTool('move'); setMenu(null) }} aria-pressed={tool === 'move'}>
            <ToolIcon t="move" />
            <span>{TOOL_NAME.move}</span>
          </button>
          {TOOL_GROUPS.map((g) => {
            const on = g.tools.includes(tool as DrawTool)
            const shownTool = on ? (tool as DrawTool) : groupPick[g.id]
            return (
              <button key={g.id} className={`tool-group${on ? ' on' : ''}${menu?.id === g.id ? ' open' : ''}`} aria-haspopup="menu" aria-expanded={menu?.id === g.id}
                aria-label={`${g.name}: ${TOOL_NAME[shownTool]}`}
                onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); setMenu(menu?.id === g.id ? null : { id: g.id, rect }) }}>
                <ToolIcon t={shownTool} />
                <span>{on ? TOOL_NAME[shownTool] : g.name} ▾</span>
              </button>
            )
          })}
          <button className={tool === 'erase' ? 'on' : ''} onClick={() => { pickTool('erase'); setMenu(null) }} aria-pressed={tool === 'erase'}>
            <ToolIcon t="erase" />
            <span>{TOOL_NAME.erase}</span>
          </button>
        </div>
        {menu && (() => {
          const g = TOOL_GROUPS.find((x) => x.id === menu.id)!
          // En móvil horizontal la barra va a la derecha: el menú se abre hacia la izquierda.
          const toLeft = side && menu.rect.left > window.innerWidth * 0.6
          const style: CSSProperties = toLeft
            ? { right: window.innerWidth - menu.rect.left + 6, top: Math.max(8, Math.min(menu.rect.top, window.innerHeight - 52 * g.tools.length - 40)) }
            : { left: Math.max(8, Math.min(menu.rect.left, window.innerWidth - 230)), bottom: window.innerHeight - menu.rect.top + 6 }
          return (
            <div className="tool-menu" role="menu" aria-label={g.name} style={style}>
              <div className="tool-menu-title">{g.name}</div>
              {g.tools.map((x) => (
                <button key={x} role="menuitemradio" aria-checked={tool === x} className={tool === x ? 'on' : ''}
                  onClick={() => { pickTool(x); setGroupPick((p) => ({ ...p, [g.id]: x })); setMenu(null) }}>
                  <ToolIcon t={x} />
                  <span>{TOOL_NAME[x]}</span>
                </button>
              ))}
            </div>
          )
        })()}
        <div className="colors" role="group" aria-label={t('Color del trazo')}>
          {COLORS.map((c) => (
            <button key={c} aria-label={`Color ${c}`} className={(color ?? DEFAULT_COLOR[activeDraw]) === c ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        <button
          onClick={clearDrawings}
          disabled={!canClear}
        >{t('Borrar trazos')}</button>
        {penSeen ? <span className="pen">{t('S Pen · ficha: mover · césped:')}{' '}{TOOL_NAME[activeDraw]}</span>
          : null}
        {/* Ajustes generales, a la derecha de la barra inferior: Mi identidad, orientación del campo e idioma. */}
        <div className="tools-end">
          <button onClick={() => setSheet('identity')}>{t('Mi identidad')}</button>
          <button onClick={() => setSheet('help')}>{t('Ayuda')}</button>
          <button className="orient" onClick={toggleVertical} aria-label={t('Orientación del campo')}>{vertical ? t('▭ Horizontal') : t('▯ Vertical')}</button>
          <select id="lang" className="lang" aria-label={t('Idioma')} value={lang} onChange={(e) => setLang(e.target.value as 'es' | 'en')}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </footer>
  )
}
