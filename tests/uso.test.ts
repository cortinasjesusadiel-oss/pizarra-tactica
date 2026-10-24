// Segunda entrega: dorsales de las plantillas.
import { describe, expect, it } from 'vitest'
import { numberPlayers } from '../src/numbering'
import { TEMPLATES } from '../src/templates'
import { ballToFeet, settleBall } from '../src/steps'
import { PITCH, ballAt, player } from '../src/model'

describe('Dorsales al cargar plantillas', () => {
  it('ningún jugador de ninguna plantilla queda sin número', () => {
    for (const t of TEMPLATES) {
      const b = numberPlayers(t.build())
      for (const k of b.tokens) if (k.kind === 'player') expect(k.label.trim(), `${t.name}: ${k.team}`).not.toBe('')
    }
  })
  it('los números nuevos no repiten ninguno que ya tuviera el equipo', () => {
    for (const t of TEMPLATES) {
      const a = t.build(), b = numberPlayers(a)
      for (const team of ['home', 'away']) {
        const idx = a.tokens.map((k, i) => [k, i] as const).filter(([k]) => k.kind === 'player' && k.team === team)
        const old = idx.filter(([k]) => k.label.trim()).map(([k]) => k.label.trim())
        const added = idx.filter(([k]) => !k.label.trim()).map(([, i]) => b.tokens[i].label)
        expect(new Set(added).size, `${t.name} ${team}`).toBe(added.length)
        for (const n of added) expect(old, `${t.name} ${team}`).not.toContain(n)
      }
    }
  })
  it('se conservan dorsales, identificadores, posiciones y pasos', () => {
    for (const t of TEMPLATES) {
      const a = t.build(), b = numberPlayers(a)
      expect(b.frames).toEqual(a.frames)
      expect(b.drawings).toEqual(a.drawings)
      a.tokens.forEach((k, i) => {
        expect(b.tokens[i].id).toBe(k.id); expect(b.tokens[i].x).toBe(k.x); expect(b.tokens[i].y).toBe(k.y)
        if (k.label.trim()) expect(b.tokens[i].label).toBe(k.label)
      })
    }
  })
  it('el arquero rival (el más cercano a su portería) lleva el 1', () => {
    const b = numberPlayers(TEMPLATES.find((t) => t.id === 'blq-alto')!.build())
    const away = b.tokens.filter((k) => k.kind === 'player' && k.team === 'away')
    const gk = away.reduce((m, k) => (k.x > m.x ? k : m))
    expect(gk.label).toBe('1')
  })
  it('no modifica la pizarra original', () => {
    const a = TEMPLATES[20].build(), before = JSON.stringify(a)
    numberPlayers(a)
    expect(JSON.stringify(a)).toBe(before)
  })
})

describe('Balón soltado encima de un jugador', () => {
  const r = PITCH.full.r
  const b = (bx: number, by: number, team: 'home' | 'away' = 'home') => ({ pitch: 'full' as const, tokens: [player(team, '3', 50, 30), { ...ballAt(bx, by), id: 'B' }], drawings: [] })
  it('encima del jugador: se va a sus pies, hacia donde ataca su equipo', () => {
    expect(ballToFeet(b(50, 30), 0, 'B')).toEqual([50 + r * 0.85, 30 + r * 0.42])
    expect(ballToFeet(b(50.3, 30, 'away'), 0, 'B')).toEqual([50 - r * 0.85, 30 + r * 0.42])
  })
  it('lejos de los jugadores: no se toca', () => {
    expect(ballToFeet(b(60, 30), 0, 'B')).toBeNull()
  })
})

describe('Plantillas: el balón no tapa el dorsal', () => {
  it('en ningún paso de ninguna plantilla el balón queda encima de un jugador', () => {
    for (const t of TEMPLATES) {
      const b = settleBall(t.build())
      const ball = b.tokens.find((k) => k.kind === 'ball')
      if (!ball) continue
      for (let i = 0; i < (b.frames?.length ?? 1); i++) expect(ballToFeet(b, i, ball.id), `${t.name}, paso ${i + 1}`).toBeNull()
    }
  })
})
