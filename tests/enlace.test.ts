// Enlace directo a una plantilla: tacticalpro.app/pizarra/?jugada=<id>
import { beforeEach, describe, expect, it } from 'vitest'
import { leerJugadaDelEnlace } from '../src/nucleo/enlace'
import { saveLast } from '../src/nucleo/storage'
import { TEMPLATES } from '../src/contenido/templates'
import { emptyBoard } from '../src/contenido/templates'

describe('Enlace a una jugada', () => {
  beforeEach(() => { localStorage.clear(); history.replaceState(null, '', '/pizarra/') })

  it('sin ?jugada= no hace nada', () => {
    expect(leerJugadaDelEnlace()).toBeNull()
    expect(location.search).toBe('')
  })

  it('lee el id, lo quita de la dirección y deja el resto igual', () => {
    history.replaceState(null, '', '/pizarra/?lang=es&jugada=blq-alto#x')
    const e = leerJugadaDelEnlace()
    expect(e?.id).toBe('blq-alto')
    expect(location.pathname + location.search + location.hash).toBe('/pizarra/?lang=es#x')
    // Al recargar ya no vuelve a abrir la plantilla.
    expect(leerJugadaDelEnlace()).toBeNull()
  })

  it('guarda la pizarra que estaba abierta para poder volver con ↶', () => {
    const previa = { ...emptyBoard('half'), tokens: [] }
    saveLast(previa)
    history.replaceState(null, '', '/pizarra/?jugada=blq-alto')
    expect(leerJugadaDelEnlace()?.previa).toEqual(previa)
  })

  it('los ids de las plantillas son únicos y caben en un enlace sin codificar', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })
})

describe('Biblioteca de la web', () => {
  it('cada enlace ?jugada= de las páginas abre una plantilla que existe y tiene su vídeo', async () => {
    const { readdirSync, readFileSync, existsSync } = await import('node:fs')
    const dir = 'public/web/biblioteca'
    const ids = new Set(TEMPLATES.map((t) => t.id))
    let n = 0
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.html'))) {
      const html = readFileSync(`${dir}/${f}`, 'utf8')
      for (const m of html.matchAll(/jugada=([a-z0-9-]+)/g)) { expect(ids, `${f}: ${m[1]}`).toContain(m[1]); n++ }
      for (const m of html.matchAll(/img\/biblioteca\/([a-z0-9-]+\.(?:mp4|webp))/g)) expect(existsSync(`public/web/img/biblioteca/${m[1]}`), m[1]).toBe(true)
    }
    expect(n).toBeGreaterThanOrEqual(3)
  })
})
