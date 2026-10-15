import { PITCH, posAt, type Board, type Drawing, type Look } from './model'
import { drawParts, sampleAt } from './motion'
import { Pitch } from './Pitch'
import { DrawingShape, TokenShape } from './Shapes'

// Lo que se dibuja dentro del campo en el instante `s` (puede ser fraccionario): césped, trazos y fichas.
// Se usa en la pizarra y al exportar el vídeo, para que ambos se vean igual.
export function Scene({ board, s, zones, brand, look, upright = false, selected = null, live = null, grass = true, ghost = false }: {
  board: Board
  brand?: string
  look?: Look
  s: number
  zones?: boolean
  upright?: boolean
  selected?: string | null
  live?: Drawing | null
  grass?: boolean
  ghost?: boolean
}) {
  const { r } = PITCH[board.pitch]
  const parts = drawParts(board, s)
  return (
    <>
      {grass && <Pitch kind={board.pitch} zones={zones} brand={brand} />}
      {board.drawings.map((d) => <DrawingShape key={d.id} d={d} />)}
      {ghost && <Ghost board={board} step={Math.round(s)} upright={upright} look={look} />}
      {parts.map(({ d, part }) => <DrawingShape key={d.id} d={d} part={part} />)}
      {live && <DrawingShape d={live} />}
      {board.tokens.map((t) => {
        const [x, y] = sampleAt(board, t, s)
        return <TokenShape key={t.id} t={{ ...t, x, y }} r={r} selected={t.id === selected} upright={upright} look={look} />
      })}
    </>
  )
}

// Mientras editas un paso, se ve en transparente dónde estaba cada ficha en el paso anterior,
// con una línea fina hasta su sitio actual. No se puede tocar ni sale en el vídeo.
function Ghost({ board, step, upright, look }: { board: Board; step: number; upright: boolean; look?: Look }) {
  if (!board.frames || step < 1) return null
  const { r } = PITCH[board.pitch]
  return (
    <g pointerEvents="none" style={{ pointerEvents: 'none' }}>
      {board.tokens.map((t) => {
        const [x0, y0] = posAt(board, t, step - 1), [x1, y1] = posAt(board, t, step)
        if (Math.hypot(x1 - x0, y1 - y0) < 0.3) return null
        return (
          <g key={t.id}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#fff" strokeOpacity={0.45} strokeWidth={0.18} strokeDasharray="0.5 0.45" />
            <g opacity={0.32}><TokenShape t={{ ...t, id: `ghost-${t.id}`, x: x0, y: y0 }} r={r} selected={false} upright={upright} look={look} /></g>
          </g>
        )
      })}
    </g>
  )
}
