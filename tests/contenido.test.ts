// Contenido precargado: todas las plantillas se abren bien y las sesiones apuntan a plantillas que existen.
import { describe, expect, it } from 'vitest'
import { PITCH } from '../src/nucleo/model'
import { SESSIONS } from '../src/contenido/sessions'
import { TEMPLATES } from '../src/contenido/templates'
import EN from '../src/lang/en.json'

describe('Plantillas y sesiones', () => {
  it('los identificadores de las plantillas no se repiten', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada plantilla se construye y sus fichas y movimientos son válidos', () => {
    for (const t of TEMPLATES) {
      const b = t.build()
      expect(PITCH[b.pitch], t.name).toBeDefined()
      const ids = new Set(b.tokens.map((k) => k.id))
      expect(ids.size, t.name).toBe(b.tokens.length)
      for (const k of b.tokens) expect(Number.isFinite(k.x) && Number.isFinite(k.y), t.name).toBe(true)
      for (const f of b.frames ?? []) {
        for (const [id, p] of Object.entries(f.pos)) {
          expect(ids.has(id), `${t.name}: un paso mueve una ficha que no existe`).toBe(true)
          expect(Number.isFinite(p[0]) && Number.isFinite(p[1]), t.name).toBe(true)
        }
        for (const d of f.drawings) expect(d.points.length, t.name).toBeGreaterThan(0)
      }
    }
  })

  it('las sesiones solo enlazan plantillas que existen', () => {
    const ids = new Set(TEMPLATES.map((t) => t.id))
    for (const s of SESSIONS) for (const bl of s.blocks) if (bl.template) expect(ids.has(bl.template), `${s.name} → ${bl.template}`).toBe(true)
  })

  it('ninguna traducción al inglés está vacía', () => {
    const empty = Object.entries(EN as Record<string, string>).filter(([, v]) => !v.trim()).map(([k]) => k)
    expect(empty).toEqual([])
  })
})
