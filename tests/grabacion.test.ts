// Jugada grabada (Pro): el balón llega al compañero aunque corra, nadie da saltos y la defensa automática presiona.
import { describe, expect, it } from 'vitest'
import { PITCH, ballAt, player, type Board, type Token } from '../src/model'
import { TEMPLATES } from '../src/templates'
import { HOLD, clipStep, holdAt, holdTotal, holdWall, keyPasses, clipToSteps, clipView, stepsToClip, trackAt, trimPauses, type Clip, type Sample } from '../src/clip'

// Rondo 4 contra 2 en el 40×30: los cuatro de fuera se mueven por la banda y se pasan el balón.
function rondo(auto: boolean): Board {
  const home: Token[] = [player('home', '1', 12, 8), player('home', '2', 28, 8), player('home', '3', 28, 22), player('home', '4', 12, 22)]
  const away: Token[] = [player('away', '5', 19, 14), player('away', '6', 22, 16)]
  const ball = ballAt(13, 8.5)
  const tracks: Record<string, Sample[]> = {}
  // Cada uno se desliza unos metros a lo largo de su lado mientras juega.
  home.forEach((h, k) => {
    const tr: Sample[] = []
    for (let i = 0; i <= 330; i++) {
      const s = i / 60
      const dx = Math.sin(s * 0.9 + k) * 3, dy = Math.cos(s * 0.7 + k) * 1.2
      tr.push([+s.toFixed(3), h.x + dx - Math.sin(k) * 3, h.y + dy - Math.cos(k) * 1.2])
    }
    tracks[h.id] = tr
  })
  const clip: Clip = { dur: 5.5, tracks, auto, passes: [{ t: 0.3, to: home[1].id }, { t: 2, to: home[2].id }, { t: 3.6, to: home[3].id }] }
  return { pitch: 'grid', tokens: [...home, ...away, ball], drawings: [], clip }
}

describe('Jugada grabada', () => {
  it('los jugadores grabados van exactamente por donde se arrastraron', () => {
    const b = rondo(false)
    const id = b.tokens[0].id
    for (const s of [0, 1.23, 2.5, 3.9]) {
      const [x, y] = clipView(b, s).pos[id], e = trackAt(b.clip!.tracks[id], s)!
      expect(Math.hypot(x - e[0], y - e[1])).toBeLessThan(0.05)
    }
  })

  it('el balón llega a cada compañero en carrera y se queda pegado a su pie', () => {
    const b = rondo(false)
    const [, h2, h3, h4] = b.tokens
    for (const [id, t] of [[h2.id, 1.95], [h3.id, 3.5], [h4.id, 5.4]] as const) {
      const v = clipView(b, t)
      expect(v.holder).toBe(id)
      const ball = v.pos[b.tokens[b.tokens.length - 1].id], p = v.pos[id]
      expect(Math.hypot(ball[0] - p[0], ball[1] - p[1])).toBeLessThan(1.6)
    }
  })

  it('nadie da saltos entre fotogramas (ni el balón)', () => {
    for (const auto of [false, true]) {
      const b = rondo(auto)
      let prev = clipView(b, 0)
      for (let f = 1; f <= 165; f++) {
        const v = clipView(b, f / 30)
        for (const tk of b.tokens) {
          const a = prev.pos[tk.id], z = v.pos[tk.id]
          // Un pase va a unos 11 m/s: en 1/30 s no puede moverse más de ~0,6 m.
          expect(Math.hypot(z[0] - a[0], z[1] - a[1])).toBeLessThan(0.75)
        }
        prev = v
      }
    }
  })

  it('con defensa automática el rival más cercano presiona al que tiene el balón', () => {
    const b = rondo(true)
    const away = b.tokens.filter((t) => t.team === 'away')
    const v = clipView(b, 5.4)
    const carrier = v.pos[v.holder!]
    const near = Math.min(...away.map((t) => Math.hypot(v.pos[t.id][0] - carrier[0], v.pos[t.id][1] - carrier[1])))
    const start = Math.min(...away.map((t) => Math.hypot(t.x - carrier[0], t.y - carrier[1])))
    // Se ha ido a por él: está bastante más cerca que al empezar.
    expect(near).toBeLessThan(start - 3)
    // Sin defensa automática los rivales se quedan quietos.
    const b2 = rondo(false)
    const still = clipView(b2, 5.4)
    for (const t of b2.tokens.filter((x) => x.team === 'away')) expect(still.pos[t.id]).toEqual([t.x, t.y])
  })

  it('quitar tiempos muertos acorta las esperas y el balón sigue llegando a cada compañero', () => {
    const b = rondo(false)
    // Todos quietos 6 s en medio (como si pensaras el siguiente movimiento) y otros 5 s al final.
    const T = 2.4, P = 6
    for (const tr of Object.values(b.clip!.tracks)) {
      const out: Sample[] = []
      for (const [t, x, y] of tr) {
        if (t <= T) out.push([t, x, y])
        else { if (out[out.length - 1][0] <= T) out.push([T + P, out[out.length - 1][1], out[out.length - 1][2]]); out.push([t + P, x, y]) }
      }
      tr.splice(0, tr.length, ...out)
    }
    b.clip!.passes = b.clip!.passes.map((p) => ({ ...p, t: p.t < T ? p.t : p.t + P }))
    b.clip!.passes[1].t = 2
    b.clip!.dur = 5.5 + P + 5
    const c = trimPauses(b)
    expect(c.dur).toBeLessThan(b.clip!.dur - 7)
    const nb = { ...b, clip: c }
    const last = clipView(nb, c.dur)
    expect(last.holder).toBe(b.tokens[3].id)
  })

  it('convertir en pasos: un paso por pase, con la flecha del pase y su explicación', () => {
    const b = rondo(true)
    const s = clipToSteps(b)
    expect(s.clip).toBeUndefined()
    expect(s.frames!.length).toBeGreaterThanOrEqual(4)
    const withPass = s.frames!.filter((f) => f.drawings.some((d) => d.type === 'pass'))
    expect(withPass.length).toBe(3)
    expect(withPass[0].note).toMatch(/(pasa al|passes to) 2/)
  })

  it('todas las plantillas animadas pasan a tiempo real sin saltos', () => {
    let n = 0
    for (const tpl of TEMPLATES) {
      const b0 = tpl.build()
      if ((b0.frames?.length ?? 0) < 2) continue
      const b = stepsToClip(b0)
      n++
      const { r } = PITCH[b.pitch]
      let prev = clipView(b, 0)
      for (let f = 1; f * (1 / 15) <= b.clip!.dur; f++) {
        const v = clipView(b, f / 15)
        for (const tk of b.tokens) {
          const a = prev.pos[tk.id], z = v.pos[tk.id]
          // En 1/15 s nadie recorre más de ~2,5 m (un pase fuerte) salvo un tiro.
          expect(Math.hypot(z[0] - a[0], z[1] - a[1]), `${tpl.name} ${tk.label}`).toBeLessThan(Math.max(2.6, r * 2))
        }
        prev = v
      }
    }
    expect(n).toBeGreaterThan(10)
  }, 30000)
})

describe('pasos en tiempo real', () => {
  it('guarda dónde empieza cada paso y siguen ahí tras quitar tiempos muertos', () => {
    const tpl = TEMPLATES.find((x) => x.animated)!
    const b = stepsToClip(tpl.build())
    const m = b.clip!.marks!
    expect(m.length).toBe(b.frames!.length)
    expect(clipStep(b.clip!, m[2] + 0.01).i).toBe(2)
    const cut = trimPauses(b)
    expect(cut.marks!.length).toBe(m.length)
  })
})

describe('momentos clave', () => {
  it('la jugada se congela en cada momento clave y luego sigue sin saltos', () => {
    const c: Clip = { dur: 10, tracks: {}, passes: [], keys: [2, 6] }
    expect(holdTotal(c)).toBeCloseTo(10 + 2 * HOLD)
    expect(holdAt(c, 1).s).toBeCloseTo(1)
    expect(holdAt(c, 2 + HOLD / 2)).toMatchObject({ s: 2, focus: { k: 2 } })
    expect(holdAt(c, 3 + HOLD).s).toBeCloseTo(3)
    expect(holdAt(c, 7 + 2 * HOLD).s).toBeCloseTo(7)
    expect(holdWall(c, 7)).toBeCloseTo(7 + 2 * HOLD)
  })
  it('encuentra los pases que hacen avanzar en una plantilla en tiempo real', () => {
    const tpl = TEMPLATES.find((x) => x.animated)!
    const b = stepsToClip(tpl.build())
    const keys = keyPasses(b)
    expect(keys.length).toBeGreaterThan(0)
    expect(keys.length).toBeLessThanOrEqual(4)
  })
})
