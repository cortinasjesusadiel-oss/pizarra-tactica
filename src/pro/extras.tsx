import { useEffect, useRef, useState, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from 'react'
import { DEFAULT_LOOK, PITCH, type Board, type Drawing, type GrassKind, type Look, type Pt } from '../nucleo/model'
import { SPEEDS, sampleAt, type Pace, type Speed } from '../nucleo/motion'
import type { SheetId } from '../pantalla/barras'
import { t, tr } from '../i18n'
import { Sim, HOLD, clipStep, keyPasses, clipToSteps, stepsToClip, newClip, smoothTrack, trimPauses, type Clip, type ClipView } from './clip'
import { PERSONAL, PRO } from './pro'
import type { ReproGrabada } from './reproduccion'

// Pizarra personal: las funciones Pro conectadas a los enchufes de la pizarra (src/extras.ts).
// Grabar en tiempo real, jugada grabada, camisetas de marca, bienvenida, césped y fichas élite.

export type ContextoExtras = {
  board: Board
  commit: (next: Board | ((b: Board) => Board)) => void
  cur: number
  playing: boolean
  stopAnim: () => void
  look: Look
  setLook: (patch: Partial<Look>) => void
  pace: Pace
  setPace: (patch: Partial<Pace>) => void
  exporting: boolean
  setSheet: (s: SheetId) => void
  avisar: (msg: string) => void
  // Lo que además necesita la pizarra personal.
  anim: number | null
  play: () => void
  setStep: (s: number) => void
  setSelected: (id: string | null) => void
  setLive: Dispatch<SetStateAction<Drawing | null>>
  setAutoplay: (on: boolean) => void
  layer: RefObject<SVGGElement>
  svg: RefObject<SVGSVGElement>
  W: number
  H: number
  grab: ReproGrabada
}

export type Desvio = { down: (e: React.PointerEvent) => void; move: (e: React.PointerEvent) => void; up: (e: React.PointerEvent) => void }

export type Extras = {
  marca?: ReactNode
  vista?: (cerrar: () => void) => ReactNode
  nombreFichas?: string
  barraPasos?: ReactNode
  trasPasos?: ReactNode
  sinPasos?: ReactNode
  ritmo?: { valor: number; elegir: (v: number) => void; opciones: ReactNode }
  desvio?: Desvio | null
  noMover?: (tokenId: string) => boolean
  fichas?: { titulo?: string; formas?: { id: string; nombre: string }[]; extra?: ReactNode }
  exportar?: ReactNode
  bienvenida?: ReactNode
  // Solo en la pizarra personal: lo que se ve encima del campo mientras se graba, si se está grabando,
  // cómo se ven las fichas mientras se graba, la explicación del paso en una jugada grabada y la pizarra con la que sale el vídeo.
  encima?: ReactNode
  grabando?: boolean
  vistaGrabando?: ClipView | null
  nota?: ReactNode
  tablero?: Board
}

// Punto del campo (en metros) bajo el puntero.
const aCampo = (layer: RefObject<SVGGElement>, e: React.PointerEvent): Pt => {
  const m = layer.current!.getScreenCTM()!.inverse()
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
  return [p.x, p.y]
}

const CESPEDES: GrassKind[] = ['clasico', 'dia', 'cuadros', 'noche']
const nombreCesped = (g: GrassKind) => (g === 'clasico' ? t('Clásico') : g === 'dia' ? t('Estadio de día') : g === 'cuadros' ? t('Cuadros') : t('Noche'))

export function useExtras(c: ContextoExtras): Extras {
  const { board, commit, cur, playing, stopAnim, look, setLook, pace, setPace, exporting, setSheet, avisar: setToast,
    anim, play, setStep, setSelected, setLive, setAutoplay, layer, svg, W, H, grab } = c
  const { clipT, setClipT } = grab
  const frames = board.frames

  // Camisetas de marca (PRO junto al logo y bienvenida con las tres al abrir).
  const [brandArt, setBrandArt] = useState<{ pro: string; trio: string } | null>(null)
  const [welcome, setWelcome] = useState(PERSONAL)
  useEffect(() => { if (PERSONAL) void import('./brandShirts').then((m) => setBrandArt(m.default)) }, [])
  useEffect(() => {
    if (!welcome || !brandArt) return
    const id = setTimeout(() => setWelcome(false), 3200)
    return () => clearTimeout(id)
  }, [welcome, brandArt])

  // Jugada de pasos que también se ve en tiempo real: el vídeo puede salir por pasos (con su tiempo para leer) o en tiempo real.
  const bothModes = !!board.clip && (board.frames?.length ?? 0) > 1
  const [videoLive, setVideoLive] = useState(false)
  const videoBoard = bothModes && !videoLive ? { ...board, clip: undefined } : board

  // ── Grabar en vivo ──
  // Pulsas Grabar, cuenta 3-2-1 y arrastras jugadores en tiempo real (con varios dedos a la vez si quieres) mientras
  // lo grabado antes se reproduce. Tocar a un compañero le pasa el balón; arrastrar el balón y soltarlo es un pase
  // hacia donde lo sueltas. Cada vez que grabas se añade una capa: así se monta un rondo o una jugada completa.
  type Drag = { id: string; dx: number; dy: number; x0: number; y0: number; at: number; moved: boolean; ball: boolean }
  const recRef = useRef<{ sim: Sim; clip: Clip; live: Record<string, Pt>; drags: Map<number, Drag>; from: Record<string, number>; t0: number; board: Board } | null>(null)
  const [rec, setRec] = useState<{ phase: 'count' | 'rec'; t: number } | null>(null)
  const [recView, setRecView] = useState<ClipView | null>(null)
  const recRaf = useRef(0)
  const REC_MAX = 90
  const toBoard = (e: React.PointerEvent) => aCampo(layer, e)
  const startRec = () => {
    stopAnim()
    setSelected(null)
    setLive(null)
    let b = board
    if (b.frames && b.clip) b = { ...b, frames: undefined }
    else if (b.frames) {
      // Se parte de cómo están las fichas en el paso que ves; los pasos se sustituyen por la grabación (se puede deshacer).
      b = { ...b, tokens: b.tokens.map((tk) => { const p = sampleAt(b, tk, cur); return { ...tk, x: p[0], y: p[1] } }), frames: undefined }
      commit(b)
      setStep(0)
      setToast(t('La grabación sustituye a los pasos. Si te equivocas, pulsa Deshacer.'))
    }
    const clip: Clip = b.clip ? { ...b.clip, tracks: Object.fromEntries(Object.entries(b.clip.tracks).map(([k, v]) => [k, [...v]])), passes: [...b.clip.passes] } : newClip(true)
    const live: Record<string, Pt> = {}
    const sim = new Sim({ ...b, clip }, clip, { live: () => live })
    recRef.current = { sim, clip, live, drags: new Map(), from: {}, t0: 0, board: b }
    setRecView(sim.view())
    setRec({ phase: 'count', t: 3 })
    const c0 = performance.now()
    const count = (now: number) => {
      const left = 3 - (now - c0) / 1000
      if (left > 0) { setRec({ phase: 'count', t: left }); recRaf.current = requestAnimationFrame(count); return }
      const r = recRef.current
      if (!r) return
      r.t0 = now
      setRec({ phase: 'rec', t: 0 })
      recRaf.current = requestAnimationFrame(tick)
    }
    const tick = (now: number) => {
      const r = recRef.current
      if (!r) return
      const target = (now - r.t0) / 1000
      // Una muestra por cada 1/60 s para cada ficha que se está arrastrando.
      while (r.sim.t + 1 / 60 <= target + 1e-9) {
        r.sim.step()
        for (const [id, p] of Object.entries(r.live)) (r.clip.tracks[id] ??= []).push([+r.sim.t.toFixed(3), +p[0].toFixed(3), +p[1].toFixed(3)])
      }
      setRecView(r.sim.view())
      setRec({ phase: 'rec', t: r.sim.t })
      if (r.sim.t >= REC_MAX) { stopRec(); return }
      recRaf.current = requestAnimationFrame(tick)
    }
    recRaf.current = requestAnimationFrame(count)
  }
  const stopRec = () => {
    cancelAnimationFrame(recRaf.current)
    const r = recRef.current
    recRef.current = null
    setRec(null)
    setRecView(null)
    setLive(null)
    if (!r || r.t0 === 0) return
    for (const id of Object.keys(r.from)) if (r.clip.tracks[id]) r.clip.tracks[id] = smoothTrack(r.clip.tracks[id], r.from[id])
    const dur = Math.max(r.clip.dur, r.sim.t)
    if (!Object.keys(r.from).length && r.clip.passes.length === (r.board.clip?.passes.length ?? 0) && !r.board.clip) return
    // El rato quieto del final (hasta que pulsas Parar) se recorta solo.
    const full: Board = { ...r.board, frames: undefined, clip: { ...r.clip, dur: +dur.toFixed(3) } }
    commit({ ...full, clip: trimPauses(full, 0.7, Infinity) })
    setClipT(0)
    setToast(t('Grabación guardada. Pulsa ▶ Reproducir para verla o graba otra capa.'))
  }
  useEffect(() => () => cancelAnimationFrame(recRaf.current), [])
  const recNearest = (p: Pt, e: React.PointerEvent, view: ClipView) => {
    const ctm = layer.current!.getScreenCTM()!
    const r0 = PITCH[board.pitch].r
    const reach = Math.max(r0 * 1.5, (e.pointerType === 'touch' ? 22 : 10) / Math.hypot(ctm.a, ctm.b))
    let best = reach, id: string | null = null
    for (const tk of board.tokens) {
      if (tk.kind !== 'player' && tk.kind !== 'ball') continue
      const q = view.pos[tk.id] ?? [tk.x, tk.y]
      // El balón tiene un poco de preferencia: está pegado a un jugador y si no costaría cogerlo.
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]) * (tk.kind === 'ball' ? 0.7 : 1)
      if (d < best) { best = d; id = tk.id }
    }
    return id
  }
  const recDown = (e: React.PointerEvent) => {
    const r = recRef.current
    if (!r || !rec || rec.phase !== 'rec') return
    const p = toBoard(e)
    const view = r.sim.view()
    const id = recNearest(p, e, view)
    if (!id) return
    try { svg.current?.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
    const q = view.pos[id]
    const ball = board.tokens.find((tk) => tk.id === id)?.kind === 'ball'
    r.drags.set(e.pointerId, { id, dx: q[0] - p[0], dy: q[1] - p[1], x0: p[0], y0: p[1], at: performance.now(), moved: false, ball })
  }
  const recMove = (e: React.PointerEvent) => {
    const r = recRef.current
    const d = r?.drags.get(e.pointerId)
    if (!r || !d) return
    const p = toBoard(e)
    if (d.ball) {
      setLive({ id: 'rec-pass', type: 'pass', color: '#ffffff', width: 0.3, points: [r.sim.ball, p] })
      return
    }
    if (!d.moved && Math.hypot(p[0] - d.x0, p[1] - d.y0) < 0.5) return
    const pos: Pt = [Math.max(-2, Math.min(W + 2, p[0] + d.dx)), Math.max(-2, Math.min(H + 2, p[1] + d.dy))]
    if (!d.moved) {
      d.moved = true
      // Esta ficha se vuelve a grabar desde ahora: lo que tenía grabado después se quita.
      const tr = (r.clip.tracks[d.id] ?? []).filter((x) => x[0] < r.sim.t)
      r.clip.tracks[d.id] = tr
      if (!(d.id in r.from)) r.from[d.id] = tr.length
      const cur0 = r.sim.pos[d.id]
      tr.push([+r.sim.t.toFixed(3), +cur0[0].toFixed(3), +cur0[1].toFixed(3)])
      d.dx = cur0[0] - p[0]; d.dy = cur0[1] - p[1]
      r.live[d.id] = cur0
      return
    }
    r.live[d.id] = pos
  }
  const recUp = (e: React.PointerEvent) => {
    const r = recRef.current
    const d = r?.drags.get(e.pointerId)
    if (!r || !d) return
    r.drags.delete(e.pointerId)
    const p = toBoard(e)
    if (d.ball) {
      setLive(null)
      // Pase hacia donde sueltas el balón: a un compañero si lo sueltas cerca de él; si no, a ese punto.
      const holderTeam = board.tokens.find((x) => x.id === r.sim.holder)?.team
      let to: string | null = null, best = 6
      for (const tk of board.tokens) {
        if (tk.kind !== 'player' || tk.id === r.sim.holder) continue
        // El pase va a un compañero, no a un rival que esté cerca.
        if (holderTeam && tk.team !== holderTeam && tk.team !== 'neutral' && holderTeam !== 'neutral') continue
        const q = r.sim.pos[tk.id]
        const dd = Math.hypot(q[0] - p[0], q[1] - p[1])
        if (dd < best) { best = dd; to = tk.id }
      }
      if (to) r.sim.pass(to)
      else if (Math.hypot(p[0] - r.sim.ball[0], p[1] - r.sim.ball[1]) > 1.5) r.sim.pass(null, p)
      return
    }
    if (!d.moved) {
      // Toque rápido sobre un jugador: pase a él.
      if (performance.now() - d.at < 450 && d.id !== r.sim.holder) {
        // Si tocas cerca de un rival pero hay un compañero al lado, el pase es para el compañero.
        const team = (id: string | null) => board.tokens.find((x) => x.id === id)?.team
        const ht = team(r.sim.holder)
        let to = d.id
        if (ht && ht !== 'neutral' && team(d.id) !== ht && team(d.id) !== 'neutral') {
          const reach = PITCH[board.pitch].r * 3
          let best = reach
          for (const tk of board.tokens) {
            if (tk.kind !== 'player' || tk.id === r.sim.holder || (tk.team !== ht && tk.team !== 'neutral')) continue
            const q = r.sim.pos[tk.id], dd = Math.hypot(q[0] - p[0], q[1] - p[1])
            if (dd < best) { best = dd; to = tk.id }
          }
        }
        r.sim.pass(to)
      }
      return
    }
    const q = r.live[d.id]
    delete r.live[d.id]
    if (q) r.clip.tracks[d.id].push([+(r.sim.t + 0.001).toFixed(3), +q[0].toFixed(3), +q[1].toFixed(3)])
  }

  // ── Jugada grabada ──
  const cutPauses = () => {
    if (!board.clip) return
    stopAnim()
    const c = trimPauses(board)
    if (c === board.clip) { setToast(t('No hay tiempos muertos que quitar.')); return }
    const saved = board.clip.dur - c.dur
    commit((b) => ({ ...b, clip: c }))
    setClipT(0)
    setToast(t('Quitados {s} s de tiempos muertos. Si no te gusta, pulsa Deshacer.', { s: saved.toFixed(1) }))
  }
  const toSteps = () => {
    if (!board.clip) return
    stopAnim()
    const nb = clipToSteps(board)
    commit(nb)
    setStep(0)
    setPace({ flow: true })
    setToast(t('Listo: {n} pasos. Escribe la explicación de cada uno. Si no te gusta, pulsa Deshacer.', { n: nb.frames!.length }))
  }
  const toLive = () => {
    if (!board.frames) return
    stopAnim()
    commit(stepsToClip(board))
    setClipT(0)
    setAutoplay(true)
  }
  const clearClip = () => { stopAnim(); commit((b) => ({ ...b, clip: undefined })); setClipT(0) }
  // Momentos clave: la jugada se congela un instante en los pases que más hacen avanzar, o donde tú digas.
  const toggleKeys = () => {
    if (!board.clip) return
    stopAnim()
    if (board.clip.keys?.length) { commit((b) => (b.clip ? { ...b, clip: { ...b.clip, keys: undefined } } : b)); setToast(t('Momentos clave quitados')); return }
    const keys = keyPasses(board)
    if (!keys.length) { setToast(t('No encontré pases que hagan avanzar mucho. Para la jugada donde quieras y pulsa «★ Pausa aquí».')); return }
    commit((b) => (b.clip ? { ...b, clip: { ...b.clip, keys } } : b))
    setToast(t('{n} momentos clave: la jugada se para {s} s en cada uno.', { n: keys.length, s: HOLD.toFixed(1) }))
  }
  const addKey = () => {
    if (!board.clip) return
    const k = +clipT.toFixed(3)
    if (board.clip.keys?.some((x) => Math.abs(x - k) < 0.3)) {
      commit((b) => (b.clip ? { ...b, clip: { ...b.clip, keys: b.clip.keys!.filter((x) => Math.abs(x - k) >= 0.3) } } : b))
      setToast(t('Pausa quitada'))
      return
    }
    commit((b) => (b.clip ? { ...b, clip: { ...b.clip, keys: [...(b.clip.keys ?? []), k].sort((x, y) => x - y) } } : b))
    setToast(t('Pausa añadida: aquí la jugada se para y resalta el pase que viene.'))
  }
  const toggleShow = (k: 'offside' | 'vision') => commit((b) => (b.clip ? { ...b, clip: { ...b.clip, show: { ...b.clip.show, [k]: !b.clip.show?.[k] } } } : b))
  const toggleAuto = () => commit((b) => (b.clip ? { ...b, clip: { ...b.clip, auto: !b.clip.auto } } : b))

  const clipSt = board.clip?.marks ? clipStep(board.clip, anim ?? clipT) : null

  return {
    marca: PRO && (brandArt ? <img className="pro-shirt" src={brandArt.pro} alt="PRO" /> : <em className="pro-tag">PRO</em>),
    vista: PRO ? (close) => (<>
      <div className="tool-menu-title">{t('Césped')}</div>
      {CESPEDES.map((g) => (
        <button key={g} role="menuitemradio" aria-checked={(look.grass ?? 'clasico') === g} className={(look.grass ?? 'clasico') === g ? 'on' : ''}
          onClick={() => { setLook({ grass: g }); close() }}>
          {nombreCesped(g)}
        </button>
      ))}
    </>) : undefined,
    nombreFichas: PRO ? t('Fichas y colores') : undefined,

    barraPasos: board.clip && (
      <>
        <button className="primary" onClick={play} disabled={!!rec} aria-label={playing ? t('Pausa') : t('Reproducir')}>{playing ? t('❚❚ Pausa') : t('▶ Reproducir')}</button>
        <input className="clip-time" type="range" min={0} max={board.clip.dur} step={0.01} value={Math.min(board.clip.dur, anim ?? clipT)} aria-label={t('Momento de la jugada')}
          onChange={(e) => { stopAnim(); setClipT(+e.target.value) }} disabled={!!rec} />
        <span className="muted small">{(anim ?? clipT).toFixed(1)} / {board.clip.dur.toFixed(1)} {t('s')}</span>
        <label className="pace">
          <span className="muted small">{t('Velocidad')}</span>
          <select value={pace.speed} onChange={(e) => { stopAnim(); setPace({ speed: e.target.value as Speed }) }} aria-label={t('Velocidad de la jugada')} disabled={!!rec}>
            {SPEEDS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        {frames && board.clip.marks && clipSt && (
          <div className="steps" role="group" aria-label={t('Pasos de la animación')}>
            {board.clip.marks.map((m, i) => (
              <button key={i} className={i === clipSt.i ? 'on' : ''} aria-label={t('Ir al paso {n}', { n: i + 1 })} onClick={() => { stopAnim(); setClipT(m + 0.01) }} disabled={!!rec}>{i + 1}</button>
            ))}
          </div>
        )}
        <span className="sep" />
        <button onClick={startRec} disabled={!!rec}>{t('● Grabar capa')}</button>
        <label className="pick"><input type="checkbox" checked={!!board.clip.auto} onChange={toggleAuto} disabled={!!rec} /><span>{t('Defensa automática')}</span></label>
        <button onClick={toggleKeys} disabled={!!rec} aria-pressed={!!board.clip.keys?.length} className={board.clip.keys?.length ? 'toggle on' : 'toggle'}>{t('★ Momentos clave')}</button>
        <button onClick={addKey} disabled={!!rec || playing}>{t('★ Pausa aquí')}</button>
        <label className="pick"><input type="checkbox" checked={!!board.clip.show?.offside} onChange={() => toggleShow('offside')} disabled={!!rec} /><span>{t('Fuera de juego')}</span></label>
        <label className="pick"><input type="checkbox" checked={!!board.clip.show?.vision} onChange={() => toggleShow('vision')} disabled={!!rec} /><span>{t('Visión y pases libres')}</span></label>
        <button onClick={cutPauses} disabled={!!rec}>{t('Quitar tiempos muertos')}</button>
        <button onClick={toSteps} disabled={!!rec}>{t('Convertir en pasos')}</button>
        <button onClick={clearClip} disabled={!!rec}>{board.frames ? t('Volver a pasos') : t('Borrar grabación')}</button>
        <button onClick={() => setSheet('export')} disabled={exporting || !!rec}>{t('Exportar vídeo')}</button>
      </>
    ),
    trasPasos: PRO && (<>
      <button className="pro-anim" onClick={startRec} disabled={!!rec} title={t('Grabar los movimientos en tiempo real')}>{t('● Grabar')}</button>
      <button className="pro-anim" onClick={toLive} disabled={!!rec} title={t('Todos se mueven a la vez y de seguido, a velocidad real')}>{t('▶ Tiempo real')}</button>
    </>),
    sinPasos: PRO && <button onClick={startRec} disabled={!!rec} title={t('Grabar los movimientos en tiempo real')}>{t('● Grabar')}</button>,
    // Ritmo de cada paso con la opción «Sin pausas» (todo de seguido).
    ritmo: {
      valor: pace.flow ? 0 : pace.step,
      elegir: (v) => setPace(v ? { step: v, flow: false } : { flow: true }),
      opciones: PRO && <option value={0}>{t('Sin pausas')}</option>,
    },

    // Mientras se graba, el puntero va a la grabación. En una jugada grabada los jugadores se mueven grabando otra capa.
    desvio: rec ? { down: recDown, move: recMove, up: recUp } : null,
    noMover: (id) => {
      if (!board.clip || board.tokens.find((x) => x.id === id)?.kind !== 'player') return false
      setToast(t('Jugada grabada: para cambiar un movimiento pulsa ● Grabar capa y arrástralo de nuevo.'))
      return true
    },

    fichas: {
      titulo: t('Estilo de fichas'),
      formas: PRO ? [{ id: 'kit', nombre: t('Camiseta élite') }, { id: 'alu', nombre: t('Aluminio técnico') }, { id: 'perfil', nombre: t('Perfil táctico') }] : undefined,
      extra: PRO && (
        <section>
          <h3>{t('Césped')}</h3>
          <div className="seg" role="group" aria-label={t('Césped')}>
            {CESPEDES.map((g) => (
              <button key={g} className={(look.grass ?? 'clasico') === g ? 'on' : ''} onClick={() => setLook({ grass: g })}>
                {nombreCesped(g)}
              </button>
            ))}
          </div>
        </section>
      ),
    },
    exportar: bothModes && (
      <div className="seg" role="group" aria-label={t('Cómo sale el vídeo')}>
        <button className={!videoLive ? 'on' : ''} aria-pressed={!videoLive} onClick={() => setVideoLive(false)}>{t('Por pasos, con tiempo para leer')}</button>
        <button className={videoLive ? 'on' : ''} aria-pressed={videoLive} onClick={() => setVideoLive(true)}>{t('En tiempo real')}</button>
      </div>
    ),
    bienvenida: welcome && brandArt && (
      <button className="welcome" onClick={() => setWelcome(false)} aria-label={t('Abrir la pizarra')}>
        <img src={brandArt.trio} alt="TacticalPro PRO · Jesús Cortinas" />
        <span className="welcome-lema">{t('Aprende · Planifica · Entrena')}</span>
        <span className="welcome-go">{t('Toca para empezar')}</span>
      </button>
    ),

    encima: rec && (
      <div className={`recbar${rec.phase === 'count' ? ' counting' : ''}`} role="status">
        {rec.phase === 'count' ? (
          <><b className="rec-count">{Math.ceil(rec.t)}</b><span>{t('Prepárate: arrastra jugadores con el dedo, el ratón o el lápiz. Toca a un compañero para pasarle el balón.')}</span></>
        ) : (
          <><b className="rec-dot">● REC</b><span className="rec-time">{rec.t.toFixed(1)} {t('s')}</span>
            <span className="muted small">{t('Arrastra jugadores (puedes usar dos dedos). Toca a un compañero para pasarle el balón.')}</span></>
        )}
        <button className="primary" onClick={stopRec}>{t('■ Parar')}</button>
      </div>
    ),
    grabando: !!rec,
    vistaGrabando: recView,
    nota: frames && clipSt && frames[clipSt.i]?.note && !rec && (
      <div className="note" aria-live="polite"><b>{t('Paso')}{' '}{clipSt.i + 1}.</b> {tr(frames[clipSt.i].note)}</div>
    ),
    tablero: videoBoard,
  }
}

// Fichas al abrir la pizarra personal: se quitan formas que ya no existen y la primera vez se estrena la camiseta élite.
export function leerFichasPro(): Look {
  try {
    const l: Look = { ...DEFAULT_LOOK, ...JSON.parse(localStorage.getItem('pizarra.fichas') ?? '{}') }
    // Las fichas con forma de muñeco se quitaron: quien las tuviera vuelve a la ficha pro.
    if (!['pro', 'disc', 'shirt', 'kit', 'alu', 'perfil'].includes(l.shape) || (['kit', 'alu', 'perfil'].includes(l.shape) && !PRO)) { l.shape = 'pro'; localStorage.setItem('pizarra.fichas', JSON.stringify(l)) }
    // Pizarra personal: la primera vez se estrena la camiseta élite (amarilla contra azul).
    if (PERSONAL && !localStorage.getItem('pizarra.kitVisto')) {
      Object.assign(l, { shape: 'kit', home: '#ffd23f', away: '#5bb6ff' })
      localStorage.setItem('pizarra.kitVisto', '1'); localStorage.setItem('pizarra.fichas', JSON.stringify(l))
    }
    return l
  } catch { return DEFAULT_LOOK }
}
