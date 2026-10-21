// Copia de seguridad: exportar e importar sin perder ni duplicar nada.
import { beforeEach, describe, expect, it } from 'vitest'
import { importBackup, makeBackup, parseBackup } from '../src/backup'
import { listPlays, savePlay, type SavedPlay } from '../src/storage'
import { TEMPLATES } from '../src/templates'

const play = (id: string, name: string): SavedPlay => ({ id, name, updated: Date.now(), board: TEMPLATES[0].build() })

describe('Copia de seguridad', () => {
  beforeEach(() => localStorage.clear())

  it('lo exportado se vuelve a leer igual', () => {
    savePlay(play('a', 'Salida de balón'))
    const text = JSON.stringify(makeBackup())
    const b = parseBackup(text)
    expect(b.plays.map((p) => p.name)).toEqual(['Salida de balón'])
  })

  it('rechaza archivos que no son una copia de TacticalPro', () => {
    expect(() => parseBackup('hola')).toThrow()
    expect(() => parseBackup(JSON.stringify({ app: 'Otra' }))).toThrow()
  })

  it('avisa si la copia es de una versión más nueva', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'TacticalPro', kind: 'copia-de-seguridad', version: 2 }))).toThrow()
  })

  it('descarta jugadas dañadas y conserva las buenas', () => {
    const b = parseBackup(JSON.stringify({ app: 'TacticalPro', kind: 'copia-de-seguridad', version: 1, plays: [play('ok', 'Buena'), { id: 'x' }] }))
    expect(b.plays.map((p) => p.id)).toEqual(['ok'])
  })

  it('al importar suma lo nuevo, no borra lo que había y no duplica', () => {
    savePlay(play('a', 'Mía'))
    const copia = parseBackup(JSON.stringify({ ...makeBackup(), plays: [play('a', 'Mía'), play('b', 'Nueva')] }))
    const r = importBackup(copia)
    expect(r.plays).toBe(1)
    expect(r.playsSkipped).toBe(1)
    expect(listPlays().map((p) => p.id).sort()).toEqual(['a', 'b'])
    // Importar otra vez la misma copia no cambia nada.
    expect(importBackup(copia).plays).toBe(0)
    expect(listPlays()).toHaveLength(2)
  })

  it('incluye la pizarra abierta aunque no esté guardada, y al importarla no la duplica', () => {
    const abierta = TEMPLATES[1].build()
    const b = parseBackup(JSON.stringify(makeBackup(abierta)))
    expect(b.current).toEqual(abierta)
    localStorage.clear()
    const r = importBackup(b)
    expect(r.current).toBe(true)
    expect(listPlays().map((p) => p.board)).toEqual([abierta])
    expect(importBackup(b).current).toBe(false)
    expect(listPlays()).toHaveLength(1)
  })

  it('no repite la pizarra abierta si ya está guardada', () => {
    const p = play('a', 'Guardada')
    savePlay(p)
    expect(makeBackup(p.board).current).toBeNull()
  })
})
