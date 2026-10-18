// Reproducir: el movimiento pasa por cada paso, es continuo (sin saltos) y respeta el ritmo elegido.
import { describe, expect, it } from 'vitest'
import { posAt } from '../src/model'
import { DEFAULT_PACE, paceAt, paceTotal, sampleAt } from '../src/motion'
import { TEMPLATES } from '../src/templates'

const animated = TEMPLATES.map((t) => ({ t, b: t.build() })).filter(({ b }) => (b.frames?.length ?? 0) > 1)

describe('Reproducir', () => {
  it('hay plantillas animadas para probar', () => {
    expect(animated.length).toBeGreaterThan(10)
  })

  it('en cada paso las fichas están exactamente donde se colocaron', () => {
    for (const { b } of animated) {
      for (let i = 0; i < b.frames!.length; i++) {
        for (const tok of b.tokens) {
          const [x, y] = sampleAt(b, tok, i), [ex, ey] = posAt(b, tok, i)
          expect(x).toBeCloseTo(ex, 6)
          expect(y).toBeCloseTo(ey, 6)
        }
      }
    }
  })

  it('el movimiento es continuo: ninguna ficha da saltos entre fotogramas', () => {
    for (const { t, b } of animated) {
      const n = b.frames!.length, fps = 30, total = paceTotal(n, DEFAULT_PACE)
      for (const tok of b.tokens) {
        let prev = sampleAt(b, tok, 0)
        for (let f = 1; f <= total * fps; f++) {
          const p = sampleAt(b, tok, paceAt(n, DEFAULT_PACE, f / fps))
          const jump = Math.hypot(p[0] - prev[0], p[1] - prev[1])
          // Más de 3 m en 1/30 s sería un salto visible.
          if (jump > 3) throw new Error(`Salto de ${jump.toFixed(1)} m en «${t.name}»`)
          prev = p
        }
      }
    }
  })

  it('cada paso empieza quieto, luego se mueve y la animación acaba en el último paso', () => {
    const n = 4
    expect(paceAt(n, DEFAULT_PACE, 0)).toBe(0)
    expect(paceAt(n, DEFAULT_PACE, 1)).toBe(0)
    const mid = paceAt(n, DEFAULT_PACE, DEFAULT_PACE.step - 0.5)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
    expect(paceAt(n, DEFAULT_PACE, paceTotal(n, DEFAULT_PACE))).toBe(n - 1)
    expect(paceTotal(n, DEFAULT_PACE)).toBe(n * DEFAULT_PACE.step)
  })
})
