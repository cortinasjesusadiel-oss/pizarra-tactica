import { SPEEDS, STEP_SECONDS, type Pace, type Speed } from '../../motion'
import type { Board } from '../../model'
import { t } from '../../i18n'
import type { ReactNode } from 'react'
import type { SheetId } from './comun'

// Barra de la animación: reproducir, pasos, explicación del paso, añadir y quitar pasos, ritmo.
export function StepBar({ frames, cur, shown, playing, play, prevStep, nextStep, glide, setNote, openNote, addStep, removeStep, pace, setPace, exporting, setSheet, clipBar, stepExtra, emptyExtra, sinPausas }: {
  frames: Board['frames']
  cur: number
  shown: number
  playing: boolean
  play: () => void
  prevStep: () => void
  nextStep: () => void
  glide: (to: number) => void
  setNote: (note: string) => void
  openNote: () => void
  addStep: () => void
  removeStep: () => void
  pace: Pace
  setPace: (p: Partial<Pace>) => void
  exporting: boolean
  setSheet: (s: SheetId) => void
  // Pizarra personal: barra de la jugada grabada en tiempo real (sustituye a la de pasos),
  // botones que van tras «Quitar paso» o tras «+ Paso» sin pasos, y la opción «Sin pausas» del ritmo.
  clipBar?: ReactNode
  stepExtra?: ReactNode
  emptyExtra?: ReactNode
  sinPausas?: boolean
}) {
  const nFrames = frames?.length ?? 0
  return (
      <div className="animbar">
          {clipBar ? clipBar : frames ? (
            <>
              <button className="primary" onClick={play} aria-label={playing ? t('Pausa') : t('Reproducir')}>{playing ? t('❚❚ Pausa') : t('▶ Reproducir')}</button>
              <button onClick={prevStep} disabled={cur === 0} aria-label={t('Paso anterior')}>‹</button>
              <div className="steps" role="group" aria-label={t('Pasos de la animación')}>
                {frames.map((_, i) => (
                  <button key={i} className={i === shown ? 'on' : ''} aria-label={t('Ir al paso {n}', { n: i + 1 })} onClick={() => glide(i)}>{i + 1}</button>
                ))}
              </div>
              {/* Con el móvil de lado no caben todos los números: se ve «paso / total» entre las flechas. */}
              <span className="step-count" aria-hidden="true">{shown + 1}/{nFrames}</span>
              <button onClick={nextStep} disabled={cur >= nFrames - 1} aria-label={t('Paso siguiente')}>›</button>
              <span className="sep" />
              <input id="step-note" className="noteinput" placeholder={t('Explica este paso')} value={frames[cur].note} onChange={(e) => setNote(e.target.value)} />
              <button className="note-open" onClick={openNote} aria-label={t('Ampliar la explicación del paso')} title={t('Ampliar la explicación del paso')}>⤢</button>
              <button onClick={addStep}>{t('+ Paso')}</button>
              <button className="step-del" onClick={removeStep} aria-label={t('Quitar paso')} title={t('Quitar paso')}><span className="long">{t('Quitar paso')}</span><span className="short" aria-hidden="true">−</span></button>
              {stepExtra}
              <label className="pace">
                <span className="muted small">{t('Cada paso')}</span>
                <select value={pace.flow ? 0 : pace.step} onChange={(e) => setPace(+e.target.value ? { step: +e.target.value, flow: false } : { flow: true })} aria-label={t('Segundos por paso')}>
                  {STEP_SECONDS.map((x) => <option key={x} value={x}>{x} {' '}{t('s')}</option>)}
                  {sinPausas && <option value={0}>{t('Sin pausas')}</option>}
                </select>
              </label>
              <label className="pace">
                <span className="muted small">{t('Velocidad')}</span>
                <select value={pace.speed} onChange={(e) => setPace({ speed: e.target.value as Speed })} aria-label={t('Velocidad del movimiento')}>
                  {SPEEDS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <button className="anim-export" onClick={() => setSheet('export')} disabled={exporting}>{t('Exportar vídeo')}</button>
            </>
          ) : (
            <>
              <span className="muted small anim-help">{t('Para animar: coloca las fichas en su posición inicial y pulsa “+ Paso”. Después mueve las fichas a donde van en ese paso.')}</span>
              <button onClick={addStep}>{t('+ Paso')}</button>
              {emptyExtra}
            </>
          )}
      </div>
  )
}
