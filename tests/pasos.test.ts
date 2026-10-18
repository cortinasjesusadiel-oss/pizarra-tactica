// «+ Paso»: cada flecha lleva a su jugador (o el balón) al final del trazo.
import { describe, expect, it } from 'vitest'
import { ballAt, line, player, type Board } from '../src/model'
import { carrier, movesFromArrows } from '../src/steps'

const board = () => {
  const p10 = player('home', '10', 30, 34)
  const p7 = player('home', '7', 30, 55)
  const rival = player('away', '4', 60, 34)
  const ball = ballAt(31, 34.3)
  const b: Board = { pitch: 'full', tokens: [p10, p7, rival, ball], drawings: [] }
  return { b, p10, p7, rival, ball }
}

describe('+ Paso', () => {
  it('reconoce quién lleva el balón', () => {
    const { b, p10 } = board()
    expect(carrier(b, 0)?.id).toBe(p10.id)
  })

  it('la carrera lleva al jugador al final de la flecha', () => {
    const { b, p7, ball } = board()
    const m = movesFromArrows(b, 0, [line('run', [[30, 55], [50, 55]])])
    expect(m[p7.id]).toEqual([50, 55])
    expect(m[ball.id]).toBeUndefined()
  })

  it('en la conducción el balón viaja con el jugador', () => {
    const { b, p10, ball } = board()
    const m = movesFromArrows(b, 0, [line('dribble', [[30, 34], [45, 34]])])
    expect(m[p10.id]).toEqual([45, 34])
    expect(m[ball.id][0]).toBeCloseTo(46)
    expect(m[ball.id][1]).toBeCloseTo(34.3)
  })

  it('el pase deja el balón a los pies del compañero', () => {
    const { b, p7, ball } = board()
    const m = movesFromArrows(b, 0, [line('pass', [[31, 34.3], [30, 55]])])
    const [x, y] = m[ball.id]
    expect(Math.hypot(x - p7.x, y - p7.y)).toBeLessThan(2)
  })

  it('la «Flecha» es solo un dibujo y no mueve a nadie', () => {
    const { b } = board()
    expect(movesFromArrows(b, 0, [line('arrow', [[30, 55], [50, 55]])])).toEqual({})
  })

  it('cada flecha mueve como mucho a un jugador', () => {
    const { b, p10, p7 } = board()
    const m = movesFromArrows(b, 0, [line('run', [[30, 34], [40, 20]]), line('run', [[30, 34], [40, 45]])])
    expect(m[p10.id]).toEqual([40, 20])
    expect(m[p7.id]).toBeUndefined()
  })
})
