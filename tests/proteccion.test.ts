// Regresiones de la primera entrega: atajos seguros al escribir, datos dañados que se apartan sin perderse.
import { beforeEach, describe, expect, it } from 'vitest'
import { isTyping } from '../src/nucleo/keys'
import { DAMAGED, damagedPlays, listPlays, loadLast, savePlay } from '../src/nucleo/storage'
import { describeImport, importBackup, parseBackup } from '../src/nucleo/backup'
import { cleanBoard } from '../src/nucleo/validation'
import { TEMPLATES } from '../src/contenido/templates'

const key = (target: EventTarget, init: KeyboardEventInit = { key: 'Backspace' }) => {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
  let typing: boolean | null = null
  const on = (ev: Event) => { typing = isTyping(ev as KeyboardEvent) }
  window.addEventListener('keydown', on)
  target.dispatchEvent(e)
  window.removeEventListener('keydown', on)
  return typing
}

beforeEach(() => { localStorage.clear(); document.body.innerHTML = '' })

describe('Atajos de teclado y campos de texto', () => {
  it.each(['textarea', 'input', 'select'])('dentro de %s los atajos de la pizarra no actúan', (tag) => {
    const el = document.createElement(tag); document.body.appendChild(el)
    for (const k of ['Backspace', 'Delete', 'z', 'y', ' ']) expect(key(el, { key: k, ctrlKey: k === 'z' || k === 'y' })).toBe(true)
  })
  it('dentro de un texto editable tampoco', () => {
    const el = document.createElement('div'); el.contentEditable = 'true'
    // jsdom no calcula isContentEditable: se simula como lo haría el navegador.
    Object.defineProperty(el, 'isContentEditable', { value: true })
    const child = document.createElement('span'); el.appendChild(child); document.body.appendChild(el)
    expect(key(el)).toBe(true)
  })
  it('un elemento dentro de una etiqueta de texto cuenta como texto', () => {
    const label = document.createElement('label'); const inp = document.createElement('input'); label.appendChild(inp); document.body.appendChild(label)
    expect(key(inp)).toBe(true)
  })
  it('mientras el teclado del móvil compone una palabra no actúan', () => {
    expect(key(document.body, { key: 'Backspace', isComposing: true })).toBe(true)
  })
  it('fuera de los textos los atajos siguen funcionando', () => {
    const b = document.createElement('button'); document.body.appendChild(b)
    expect(key(document.body)).toBe(false)
    expect(key(b)).toBe(false)
  })
})

describe('Datos dañados: se apartan sin perderse', () => {
  it('lo dañado se guarda aparte, intacto, y no se pisa al volver a guardar', () => {
    localStorage.setItem('pizarra.jugadas.v1', '{"roto":true}')
    expect(listPlays()).toEqual([])
    expect(damagedPlays()).toBe('{"roto":true}')
    savePlay({ id: 'a', name: 'A', updated: 1, board: TEMPLATES[0].build() })
    localStorage.setItem('pizarra.jugadas.v1', 'otra cosa rota')
    listPlays()
    expect(localStorage.getItem(DAMAGED)).toBe('{"roto":true}')
  })
  it('si solo una jugada está dañada, las buenas se siguen viendo', () => {
    const good = { id: 'g', name: 'Buena', updated: 2, board: TEMPLATES[1].build() }
    localStorage.setItem('pizarra.jugadas.v1', JSON.stringify([good, { id: 'm', name: 'Mala', updated: 1, board: { pitch: 'full', tokens: [null], drawings: [] } }]))
    expect(listPlays().map((p) => p.id)).toEqual(['g'])
    expect(damagedPlays()).not.toBeNull()
  })
  it('una pizarra abierta dañada no se abre (la app empieza con una plantilla)', () => {
    localStorage.setItem('pizarra.ultima.v1', '{"pitch":"inventado","tokens":[],"drawings":[]}')
    expect(loadLast()).toBeNull()
  })
  it('todas las plantillas pasan la validación sin cambios', () => {
    for (const t of TEMPLATES) { const b = t.build(); expect(cleanBoard(JSON.parse(JSON.stringify(b))), t.name).toEqual(JSON.parse(JSON.stringify(b))) }
  })
  it('se conservan campos de versiones más nuevas', () => {
    const b = { pitch: 'full', tokens: [{ id: 'x', kind: 'player', team: 'home', label: '9', x: 1, y: 2, nuevo: 7 }], drawings: [], extra: 'sí' }
    expect(cleanBoard(b)).toEqual(b)
  })
  it('al importar se dice cuántas jugadas venían dañadas', () => {
    const good = { id: 'g', name: 'Buena', updated: 2, board: TEMPLATES[1].build() }
    const bad = { id: 'm', name: 'Mala', updated: 1, board: { pitch: 'full', tokens: [], drawings: [], frames: [] } }
    const b = parseBackup(JSON.stringify({ app: 'TacticalPro', kind: 'copia-de-seguridad', version: 1, plays: [good, bad] }))
    const r = importBackup(b)
    expect(r.plays).toBe(1)
    expect(describeImport(r)).toMatch(/1 (jugada estaba dañada|play was damaged)/)
  })
})
