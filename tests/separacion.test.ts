// La web y la pizarra personal (Pro) nunca se mezclan. En la pizarra personal todo lo Pro está en src/pro
// y entra por los enchufes de src/extras.ts; solo unos pocos archivos del núcleo lo usan directamente.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) ? [p] : []
})

// Archivos fuera de src/pro que pueden usar código Pro (enchufes y partes del dibujo y la animación).
const PERMITIDOS = [
  'App.tsx', 'extras.ts',
  'nucleo/model.ts', 'nucleo/motion.ts',
  'pantalla/Scene.tsx', 'pantalla/Shapes.tsx', 'pantalla/material.ts',
  'exportar/exportVideo.ts',
]

describe('Separación de lo Pro', () => {
  it('solo los archivos permitidos usan src/pro', () => {
    const src = join(__dirname, '../src')
    const usan = files(src)
      .map((f) => relative(src, f).split('\\').join('/'))
      .filter((f) => !f.startsWith('pro/') && /(from |import\()'[./]*\/?pro\//.test(readFileSync(join(src, f), 'utf8')))
      .sort()
    expect(usan.filter((f) => !PERMITIDOS.includes(f))).toEqual([])
  })
})
