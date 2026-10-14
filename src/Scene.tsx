import { PITCH, type Board, type Drawing } from './model'
import { sampleAt, shownStep } from './motion'
import { Pitch } from './Pitch'
import { DrawingShape, TokenShape } from './Shapes'

// Lo que se dibuja dentro del campo en el instante `s` (puede ser fraccionario): césped, trazos y fichas.
// Se usa en la pizarra y al exportar el vídeo, para que ambos se vean igual.
export function Scene({ board, s, zones, upright = false, selected = null, live = null, grass = true }: {
  board: Board
  s: number
  zones?: boolean
  upright?: boolean
  selected?: string | null
  live?: Drawing | null
  grass?: boolean
}) {
  const { r } = PITCH[board.pitch]
  const step = board.frames?.[shownStep(board, s)]
  return (
    <>
      {grass && <Pitch kind={board.pitch} zones={zones} />}
      {board.drawings.map((d) => <DrawingShape key={d.id} d={d} />)}
      {step?.drawings.map((d) => <DrawingShape key={d.id} d={d} />)}
      {live && <DrawingShape d={live} />}
      {board.tokens.map((t) => {
        const [x, y] = sampleAt(board, t, s)
        return <TokenShape key={t.id} t={{ ...t, x, y }} r={r} selected={t.id === selected} upright={upright} />
      })}
    </>
  )
}
