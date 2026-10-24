// Datos y memoria del dispositivo: preferencias guardadas y deshacer/rehacer.
import { createElement } from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { leerJson } from '../src/nucleo/memoria'
import { guardarEstiloLetrero, leerEstiloLetrero, loadVopts, primeraVez, ayudaVista } from '../src/nucleo/preferencias'
import { useHistorial, type Historial } from '../src/nucleo/historial'
import { TEMPLATES } from '../src/contenido/templates'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Preferencias guardadas', () => {
  beforeEach(() => localStorage.clear())

  it('una opción guardada se mezcla con las de por defecto', () => {
    localStorage.setItem('pizarra.ritmo', JSON.stringify({ step: 8 }))
    expect(leerJson('pizarra.ritmo', { step: 5, speed: 'normal' })).toEqual({ step: 8, speed: 'normal' })
  })

  it('un valor roto no rompe nada: se usan los de por defecto', () => {
    localStorage.setItem('pizarra.fichas', '{roto')
    expect(leerJson('pizarra.fichas', { a: 1 })).toEqual({ a: 1 })
  })

  it('el cierre del vídeo sale por defecto y se recuerda si se quita', () => {
    expect(loadVopts()).toEqual({ big: false, outro: true })
    localStorage.setItem('pizarra.video', JSON.stringify({ big: true, outro: false }))
    expect(loadVopts().outro).toBe(true)
    localStorage.setItem('pizarra.cierre', '0')
    expect(loadVopts()).toEqual({ big: true, outro: false })
  })

  it('el letrero nuevo usa el último estilo', () => {
    expect(leerEstiloLetrero()).toEqual({})
    guardarEstiloLetrero({ color: '#ff0', bg: 'none', fs: 3 })
    expect(leerEstiloLetrero()).toEqual({ color: '#ff0', bg: 'none', fs: 3 })
  })

  it('la bienvenida sale hasta que se cierra una vez', () => {
    expect(primeraVez()).toBe(true)
    ayudaVista()
    expect(primeraVez()).toBe(false)
  })
})

describe('Deshacer y rehacer', () => {
  let h: Historial
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot>
  const Prueba = () => { h = useHistorial(() => TEMPLATES[0].build()); return null }
  beforeEach(() => { host = document.createElement('div'); root = createRoot(host); act(() => root.render(createElement(Prueba))) })
  afterEach(() => act(() => root.unmount()))

  it('deshace y rehace un cambio', () => {
    const antes = h.board
    expect(h.puedeDeshacer).toBe(false)
    act(() => h.commit((b) => ({ ...b, tokens: [] })))
    expect(h.board.tokens).toEqual([])
    expect(h.puedeDeshacer).toBe(true)
    act(() => { h.deshacer(); h.refrescar() })
    expect(h.board).toBe(antes)
    expect(h.puedeRehacer).toBe(true)
    act(() => { h.rehacer(); h.refrescar() })
    expect(h.board.tokens).toEqual([])
  })

  it('un cambio nuevo borra lo que se podía rehacer', () => {
    act(() => h.commit((b) => ({ ...b, tokens: [] })))
    act(() => { h.deshacer(); h.refrescar() })
    act(() => h.commit((b) => ({ ...b, drawings: [] })))
    expect(h.puedeRehacer).toBe(false)
  })

  it('guarda como mucho 100 pasos atrás', () => {
    for (let i = 0; i < 120; i++) act(() => h.commit((b) => ({ ...b })))
    let n = 0
    act(() => { while (h.deshacer()) n++ })
    expect(n).toBe(100)
  })

  it('sin nada que deshacer no pasa nada', () => {
    let r = true
    act(() => { r = h.deshacer() })
    expect(r).toBe(false)
  })
})
