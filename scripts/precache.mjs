// Después del build: escribe en dist/sw.js la lista de archivos de la app y una versión nueva, para que el
// móvil la guarde entera en la primera visita y funcione sin conexión desde ese momento (también el vídeo
// y las fuentes, que solo se cargan al usarlos).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const dist = 'dist'
const files = []
const walk = (d) => readdirSync(d).forEach((n) => {
  const p = join(d, n)
  if (statSync(p).isDirectory()) { if (!['web', 'screens'].includes(n)) walk(p) }
  else files.push(relative(dist, p).split('\\').join('/'))
})
walk(dist)
const list = ['./', ...files.filter((x) => x !== 'sw.js' && !x.endsWith('.map')).map((x) => `./${x}`)]
const sw = join(dist, 'sw.js')
writeFileSync(sw, readFileSync(sw, 'utf8').replace("'__PRECACHE__'", JSON.stringify(list)).replace('__VERSION__', Date.now().toString(36)))
console.log(`sw.js: ${list.length} archivos para usar sin conexión`)
