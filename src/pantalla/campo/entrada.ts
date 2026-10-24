import { useRef, type Dispatch, type RefObject, type SetStateAction } from 'react'
import { DEFAULT_COLOR, STRAIGHT, lobBend, posAt, uid, type Board, type DrawTool, type Drawing, type Pt, type Tool } from '../../nucleo/model'
import { ballToFeet, carrier } from '../../nucleo/steps'
import { t } from '../../i18n'
import { editLabel, newLabel, type LabelEdit } from './letrero'

// Lo que se está haciendo con el puntero apoyado en el campo.
type Action =
  | { kind: 'move'; id: string; dx: number; dy: number; ball?: { id: string; ox: number; oy: number } }
  | { kind: 'draw'; drawing: Drawing; raw?: Pt[] }
  | { kind: 'erase' }
  | { kind: 'moveText'; id: string; dx: number; dy: number; edit?: Drawing }
  | { kind: 'rotate'; id: string; c: Pt; d0: number; size0: number }
  | { kind: 'none' }

// Lo que el campo necesita de la pizarra para responder al dedo, al ratón y al lápiz.
export type ContextoCampo = {
  board: Board
  setBoard: Dispatch<SetStateAction<Board>>
  cur: number
  W: number
  H: number
  layer: RefObject<SVGGElement>
  svg: RefObject<SVGSVGElement>
  tool: Tool
  penTool: DrawTool
  color: string | null
  penSeen: boolean
  setPenSeen: (v: boolean) => void
  playing: boolean
  anim: number | null
  stopAnim: () => void
  setSelected: (id: string | null) => void
  setLive: (d: Drawing | null) => void
  setLabel: (l: LabelEdit | null) => void
  apuntar: (b: Board) => void
  olvidar: () => void
  refrescar: () => void
  // Pizarra personal: mientras se graba en tiempo real el puntero va a la grabación; avisos en pantalla.
  rec?: { down: (e: React.PointerEvent) => void; move: (e: React.PointerEvent) => void; up: (e: React.PointerEvent) => void } | null
  avisar?: (msg: string) => void
}

// Punto del campo (en metros) bajo el puntero.
export function aCampo(layer: RefObject<SVGGElement>, e: React.PointerEvent): Pt {
  const m = layer.current!.getScreenCTM()!.inverse()
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
  return [p.x, p.y]
}

// Tocar, arrastrar, dibujar y borrar sobre el campo.
// Mover una ficha, dibujar un trazo, borrar, girar el material o recolocar un letrero se apunta una sola vez en el historial.
export function useEntradaCampo(c: ContextoCampo) {
  const { board, setBoard, cur, W, H, layer, svg, tool, penTool, color, penSeen, setPenSeen, playing, anim, stopAnim,
    setSelected, setLive, setLabel, apuntar, olvidar, refrescar, rec, avisar } = c
  const pendingSel = useRef<string | null | undefined>(undefined)
  const action = useRef<Action>({ kind: 'none' })
  const pointer = useRef<number | null>(null)
  const penDown = useRef(false)
  const startSnap = useRef<string>('')

  const toBoard = (e: React.PointerEvent): Pt => aCampo(layer, e)
  const widthFor = (e: React.PointerEvent) => {
    const p = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5
    return +(0.22 + p * 0.4).toFixed(2)
  }

  // La goma busca trazos alrededor del punto (más amplio con el dedo), porque las líneas son finas.
  // Las fichas solo se borran tocándolas de lleno, para no llevarse un jugador por error.
  const eraseAt = (cx: number, cy: number, touch = false) => {
    const at = (x: number, y: number, sel: string) => document.elementFromPoint(x, y)?.closest(sel)?.getAttribute(sel.slice(1, -1)) ?? null
    let d: string | null = at(cx, cy, '[data-draw]')
    if (!d) {
      // Trazo más cercano a menos de 16 px (7 con ratón o lápiz), medido sobre sus puntos.
      const ctm = layer.current!.getScreenCTM()!
      const k = Math.hypot(ctm.a, ctm.b)
      const q = new DOMPoint(cx, cy).matrixTransform(ctm.inverse())
      let best = (touch ? 16 : 7) / k
      const segDist = (a: Pt, b: Pt) => {
        const vx = b[0] - a[0], vy = b[1] - a[1], l = vx * vx + vy * vy
        const u = l ? Math.max(0, Math.min(1, ((q.x - a[0]) * vx + (q.y - a[1]) * vy) / l)) : 0
        return Math.hypot(a[0] + u * vx - q.x, a[1] + u * vy - q.y)
      }
      for (const dr of [...board.drawings, ...(board.frames?.[cur]?.drawings ?? [])]) {
        const ps = dr.points
        if (dr.type === 'text') continue
        const pts: Pt[] = dr.type === 'zone' && ps.length === 2 ? [ps[0], [ps[1][0], ps[0][1]], ps[1], [ps[0][0], ps[1][1]], ps[0]] : ps
        for (let i = 0; i < pts.length; i++) {
          const dist = segDist(pts[i], pts[Math.min(i + 1, pts.length - 1)])
          if (dist < best) { best = dist; d = dr.id }
        }
      }
    }
    const t = d ? null : at(cx, cy, '[data-token]')
    if (d) setBoard((b) => ({
      ...b,
      drawings: b.drawings.filter((x) => x.id !== d),
      frames: b.frames?.map((f) => ({ ...f, drawings: f.drawings.filter((x) => x.id !== d) })),
    }))
    else if (t) setBoard((b) => ({ ...b, tokens: b.tokens.filter((x) => x.id !== t) }))
  }

  const onDown = (e: React.PointerEvent) => {
    if (rec) { rec.down(e); return }
    if (pointer.current !== null) return
    const isPen = e.pointerType === 'pen'
    // Con el lápiz apoyado se ignora la palma de la mano.
    if (e.pointerType === 'touch' && penDown.current) return
    if (isPen && !penSeen) setPenSeen(true)
    if (playing || anim !== null) stopAnim()
    const p = toBoard(e)
    // Tirador del material seleccionado: girarlo y cambiar su tamaño.
    const rotId = (e.target as Element).closest('[data-rotate]')?.getAttribute('data-rotate')
    const rt = rotId ? board.tokens.find((x) => x.id === rotId) : undefined
    if (rt) {
      const c = posAt(board, rt, cur)
      pointer.current = e.pointerId
      try { svg.current?.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
      apuntar(board)
      startSnap.current = JSON.stringify(board)
      action.current = { kind: 'rotate', id: rt.id, c, d0: Math.max(0.5, Math.hypot(p[0] - c[0], p[1] - c[1])), size0: rt.size ?? 1 }
      return
    }
    let tokenId = (e.target as Element).closest('[data-token]')?.getAttribute('data-token') ?? null
    // Con el dedo, en el móvil las fichas se ven pequeñas: se coge la ficha más cercana a unos 18 px del toque.
    if (!tokenId && e.pointerType === 'touch') {
      const ctm = layer.current!.getScreenCTM()!
      const reach = 18 / Math.hypot(ctm.a, ctm.b)
      let best = reach
      for (const t of board.tokens) {
        const [x, y] = posAt(board, t, cur)
        const d = Math.hypot(x - p[0], y - p[1])
        if (d < best) { best = d; tokenId = t.id }
      }
    }
    // El balón va dibujado a los pies de quien lo lleva y tapa parte de su ficha: si el toque está más cerca
    // del centro del jugador que del centro del balón, se coge al jugador (y el balón va pegado a él).
    // El balón se sigue pudiendo coger tocándolo por su lado de fuera.
    const hit = tokenId ? board.tokens.find((x) => x.id === tokenId) : undefined
    if (hit?.kind === 'ball') {
      const c = carrier(board, cur)
      if (c) {
        const [cx, cy] = posAt(board, c, cur), [bx, by] = posAt(board, hit, cur)
        if (Math.hypot(p[0] - cx, p[1] - cy) < Math.hypot(p[0] - bx, p[1] - by)) tokenId = c.id
      }
    }
    // Letreros: con la herramienta Texto se toca para escribir uno nuevo o para editar uno que ya está.
    const labelId = (e.target as Element).closest('g.label')?.getAttribute('data-draw') ?? null
    const allDrawings = [...board.drawings, ...(board.frames?.[cur]?.drawings ?? [])]
    if (tool === 'text' && !(isPen && (e.buttons & 2 || e.buttons & 32))) {
      const d = labelId ? allDrawings.find((x) => x.id === labelId) : undefined
      if (!d) { setLabel(newLabel(p)); return }
      // Sobre un letrero: arrastrarlo lo recoloca; tocarlo sin moverlo lo abre para editarlo.
      pointer.current = e.pointerId
      try { svg.current?.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
      apuntar(board)
      startSnap.current = JSON.stringify(board)
      action.current = { kind: 'moveText', id: d.id, dx: d.points[0][0] - p[0], dy: d.points[0][1] - p[1], edit: d }
      return
    }
    // Botón lateral del S Pen (2) o goma del lápiz (32): borrar.
    const penErase = isPen && (e.buttons & 2 || e.buttons & 32)
    const fingerWithPen = penSeen && e.pointerType === 'touch'

    let mode: 'move' | 'draw' | 'erase' = 'move'
    let drawTool: DrawTool = penTool
    if (penErase || tool === 'erase') mode = 'erase'
    else if (isPen) {
      // Lápiz en modo Mover: sobre una ficha la mueve, sobre el césped dibuja.
      if (tool === 'move') mode = tokenId ? 'move' : 'draw'
      else { mode = 'draw'; drawTool = tool }
    } else if (fingerWithPen) mode = 'move'
    else if (tool !== 'move') { mode = 'draw'; drawTool = tool }

    pointer.current = e.pointerId
    if (isPen) penDown.current = true
    try { svg.current?.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
    apuntar(board)
    startSnap.current = JSON.stringify(board)

    if (mode === 'move' && !tokenId && labelId) {
      // Arrastrar un letrero para recolocarlo.
      const d = allDrawings.find((x) => x.id === labelId)
      if (d) { action.current = { kind: 'moveText', id: d.id, dx: d.points[0][0] - p[0], dy: d.points[0][1] - p[1] }; return }
    }
    if (mode === 'move' && board.clip && tokenId && board.tokens.find((x) => x.id === tokenId)?.kind === 'player') {
      // En una jugada grabada los jugadores se mueven grabando otra capa.
      action.current = { kind: 'none' }
      avisar?.(t('Jugada grabada: para cambiar un movimiento pulsa ● Grabar capa y arrástralo de nuevo.'))
      return
    }
    if (mode === 'move') {
      const t = board.tokens.find((x) => x.id === tokenId)
      // La barra de la ficha aparece al soltar: si apareciera ya, la pizarra se movería bajo el dedo.
      pendingSel.current = t ? t.id : null
      if (t) {
        const [x, y] = posAt(board, t, cur)
        // Si mueves al jugador que lleva el balón, el balón va pegado a él.
        const ball = t.kind === 'player' && carrier(board, cur)?.id === t.id ? board.tokens.find((k) => k.kind === 'ball') : undefined
        const bp = ball ? posAt(board, ball, cur) : null
        action.current = { kind: 'move', id: t.id, dx: x - p[0], dy: y - p[1], ball: ball && bp ? { id: ball.id, ox: bp[0] - x, oy: bp[1] - y } : undefined }
      } else action.current = { kind: 'none' }
    } else if (mode === 'draw') {
      setSelected(null)
      const drawing: Drawing = { id: uid(), type: drawTool, color: color ?? DEFAULT_COLOR[drawTool], width: widthFor(e), points: [p] }
      action.current = { kind: 'draw', drawing }
      setLive(drawing)
    } else {
      action.current = { kind: 'erase' }
      eraseAt(e.clientX, e.clientY, e.pointerType === 'touch')
    }
  }

  const onMove = (e: React.PointerEvent) => {
    if (rec) { rec.move(e); return }
    if (e.pointerId !== pointer.current) return
    const a = action.current
    if (a.kind === 'move') {
      const [x, y] = toBoard(e)
      const nx = Math.max(-2, Math.min(W + 2, x + a.dx)), ny = Math.max(-2, Math.min(H + 2, y + a.dy))
      const set: Record<string, Pt> = { [a.id]: [nx, ny] }
      if (a.ball) set[a.ball.id] = [nx + a.ball.ox, ny + a.ball.oy]
      setBoard((b) => {
        // En el paso 0 se mueve la posición inicial; en los demás, solo la de ese paso.
        if (b.frames && cur > 0)
          return { ...b, frames: b.frames.map((f, i) => (i === cur ? { ...f, pos: { ...f.pos, ...set } } : f)) }
        return { ...b, tokens: b.tokens.map((t) => (set[t.id] ? { ...t, x: set[t.id][0], y: set[t.id][1] } : t)) }
      })
    } else if (a.kind === 'draw') {
      const p = toBoard(e)
      const pts = a.drawing.points
      const last = pts[pts.length - 1]
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.35) return
      const width = e.pointerType === 'pen' ? +(a.drawing.width * 0.8 + widthFor(e) * 0.2).toFixed(2) : a.drawing.width
      a.drawing = { ...a.drawing, width, points: STRAIGHT.includes(a.drawing.type) || a.drawing.type === 'zone' ? [pts[0], p] : [...pts, p] }
      // Pase aéreo: se guarda el trazo entero para saber si lo curvas a un lado o lo dejas recto.
      if (a.drawing.type === 'lob') { a.raw = [...(a.raw ?? [pts[0]]), p]; a.drawing.bend = lobBend(a.raw) }
      setLive(a.drawing)
    } else if (a.kind === 'erase') {
      eraseAt(e.clientX, e.clientY, e.pointerType === 'touch')
    } else if (a.kind === 'rotate') {
      const [x, y] = toBoard(e)
      const dx = x - a.c[0], dy = y - a.c[1]
      let ang = (Math.atan2(dx, -dy) * 180) / Math.PI
      ang = ((ang % 360) + 360) % 360
      // Giro continuo; solo se queda fijo en los ángulos rectos y a 45° si pasas muy cerca.
      const near45 = Math.round(ang / 45) * 45
      ang = Math.abs(ang - near45) < 2.5 ? near45 % 360 : +ang.toFixed(1)
      const size = +Math.max(0.4, Math.min(2.5, (a.size0 * Math.hypot(dx, dy)) / a.d0)).toFixed(3)
      setBoard((b) => ({ ...b, tokens: b.tokens.map((t) => (t.id === a.id ? { ...t, rot: ang, size } : t)) }))
    } else if (a.kind === 'moveText') {
      const [x, y] = toBoard(e)
      const pt: Pt = [x + a.dx, y + a.dy]
      const mv = (l: Drawing[]) => l.map((d) => (d.id === a.id ? { ...d, points: [pt] } : d))
      setBoard((b) => ({ ...b, drawings: mv(b.drawings), frames: b.frames?.map((f) => ({ ...f, drawings: mv(f.drawings) })) }))
    }
  }

  const onUp = (e: React.PointerEvent) => {
    if (rec) { rec.up(e); return }
    if (e.pointerId !== pointer.current) return
    pointer.current = null
    if (e.pointerType === 'pen') penDown.current = false
    const a = action.current
    action.current = { kind: 'none' }
    if (pendingSel.current !== undefined) { setSelected(pendingSel.current); pendingSel.current = undefined }
    // Balón soltado encima de un jugador: se deja a sus pies para que se siga viendo su número.
    const feet = a.kind === 'move' && !a.ball ? ballToFeet(board, cur, a.id) : null
    const now = a.kind === 'move' ? board.tokens.find((t) => t.id === a.id) : undefined
    if (a.kind === 'move' && feet && now && posAt(board, now, cur).some((v, i) => Math.abs(v - feet[i]) > 0.01)) {
      const id = a.id
      setBoard((b) => (b.frames && cur > 0
        ? { ...b, frames: b.frames.map((f, i) => (i === cur ? { ...f, pos: { ...f.pos, [id]: feet } } : f)) }
        : { ...b, tokens: b.tokens.map((t) => (t.id === id ? { ...t, x: feet[0], y: feet[1] } : t)) }))
      refrescar()
      return
    }
    if (a.kind === 'draw') {
      setLive(null)
      const p = a.drawing.points
      const [x0, y0] = p[0], [x1, y1] = p[p.length - 1]
      const ok = a.drawing.type === 'text' ? false : a.drawing.type === 'zone' ? Math.abs(x1 - x0) > 1 && Math.abs(y1 - y0) > 1 : p.length > 1 && Math.hypot(x1 - x0, y1 - y0) > 1
      if (ok) {
        setBoard((b) => (b.frames
          ? { ...b, frames: b.frames.map((f, i) => (i === cur ? { ...f, drawings: [...f.drawings, a.drawing] } : f)) }
          : { ...b, drawings: [...b.drawings, a.drawing] }))
      } else olvidar()
    } else if (JSON.stringify(board) === startSnap.current) {
      olvidar()
      if (a.kind === 'moveText' && a.edit) setLabel(editLabel(a.edit))
    }
    refrescar()
  }

  return { onDown, onMove, onUp }
}
