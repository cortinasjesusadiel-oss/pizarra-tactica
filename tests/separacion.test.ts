// La web y la pizarra personal (Pro) nunca se mezclan: en la web los enchufes están vacíos y nada usa código Pro.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PLANTILLAS_EXTRA, leerFichasExtra, useExtras } from '../src/extras'

const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : []
})

describe('Separación entre la web y la pizarra personal', () => {
  it('los enchufes de la web están vacíos', () => {
    expect(useExtras({} as never)).toEqual({})
    expect(PLANTILLAS_EXTRA).toEqual([])
    expect(leerFichasExtra).toBeUndefined()
  })

  it('la web no tiene carpeta Pro ni importa nada de ella', () => {
    const src = join(__dirname, '../src')
    expect(readdirSync(src)).not.toContain('pro')
    const usan = files(src).filter((f) => /from '[./]*\/?pro\//.test(readFileSync(f, 'utf8')))
    expect(usan).toEqual([])
  })
})
