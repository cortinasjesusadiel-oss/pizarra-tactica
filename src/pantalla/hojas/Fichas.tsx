import { TEAM_COLORS, type GrassKind, type Look, type TokenShapeKind, type TokenText } from '../../nucleo/model'
import { Markers, TokenShape } from '../Shapes'
import { PRO } from '../../pro/pro'
import { t } from '../../i18n'
import { Sheet } from './Hoja'

export function LookSheet({ look, setLook, onClose }: { look: Look; setLook: (p: Partial<Look>) => void; onClose: () => void }) {
  const preview = (shape: TokenShapeKind) => (
    <svg viewBox="-6 -3.2 12 7.4" width="120" height="74" aria-hidden="true">
      <Markers />
      <rect x="-10" y="-10" width="20" height="20" fill="var(--pitch)" />
      <TokenShape t={{ id: 'a', kind: 'player', team: 'home', label: '10', name: t('Martín'), x: -2.6, y: -0.4 }} r={1.5} selected={false} upright={false} look={{ ...look, shape }} />
      <TokenShape t={{ id: 'b', kind: 'player', team: 'away', label: '9', name: t('Rivas'), x: 2.6, y: -0.4 }} r={1.5} selected={false} upright={false} look={{ ...look, shape }} />
    </svg>
  )
  const swatches = (team: 'home' | 'away') => (
    <div className="colors" role="group" aria-label={team === 'home' ? t('Color del local') : t('Color del rival')}>
      {TEAM_COLORS.map((c) => (
        <button key={c} aria-label={`Color ${c}`} className={look[team] === c ? 'on' : ''} style={{ background: c }} onClick={() => setLook({ [team]: c })} />
      ))}
    </div>
  )
  return (
    <Sheet title={t('Fichas')} onClose={onClose}>
      <section>
        <h3>{t('Estilo de fichas')}</h3>
        <div className="shapes">
          {((PRO ? ['kit', 'alu', 'perfil', 'pro', 'disc', 'shirt'] : ['pro', 'disc', 'shirt']) as TokenShapeKind[]).map((sh) => (
            <button key={sh} className={look.shape === sh ? 'on' : ''} onClick={() => setLook({ shape: sh })}>
              {preview(sh)}
              <span>{sh === 'kit' ? t('Camiseta élite') : sh === 'alu' ? t('Aluminio técnico') : sh === 'perfil' ? t('Perfil táctico') : sh === 'pro' ? t('Ficha pro') : sh === 'disc' ? t('Clásica') : t('Camiseta')}</span>
            </button>
          ))}
        </div>
      </section>
      {PRO && (
        <section>
          <h3>{t('Césped')}</h3>
          <div className="seg" role="group" aria-label={t('Césped')}>
            {(['clasico', 'dia', 'cuadros', 'noche'] as GrassKind[]).map((g) => (
              <button key={g} className={(look.grass ?? 'clasico') === g ? 'on' : ''} onClick={() => setLook({ grass: g })}>
                {g === 'clasico' ? t('Clásico') : g === 'dia' ? t('Estadio de día') : g === 'cuadros' ? t('Cuadros') : t('Noche')}
              </button>
            ))}
          </div>
        </section>
      )}
      <section>
        <h3>{t('Mostrar')}</h3>
        <div className="seg" role="group" aria-label={t('Qué mostrar')}>
          {(['number', 'name', 'both'] as TokenText[]).map((tx) => (
            <button key={tx} className={look.text === tx ? 'on' : ''} onClick={() => setLook({ text: tx })}>
              {tx === 'number' ? t('Número') : tx === 'name' ? t('Nombre') : t('Número y nombre')}
            </button>
          ))}
        </div>
        <p className="muted small">{t('Para poner el nombre, toca un jugador en la pizarra y escríbelo en “Nombre”, junto al dorsal.')}</p>
      </section>
      <section>
        <h3>{t('Color del local')}</h3>
        {swatches('home')}
        <h3>{t('Color del rival')}</h3>
        {swatches('away')}
      </section>
      <p className="muted small">{t('Se aplica a todas las pizarras, imágenes y vídeos.')}</p>
    </Sheet>
  )
}
