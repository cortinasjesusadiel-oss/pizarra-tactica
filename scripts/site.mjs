// Después del build: la web (public/web) pasa a la raíz del sitio y la app queda en /app/.
//   tacticalpro.app/          → la web, la dirección para compartir
//   tacticalpro.app/app/      → la pizarra
//   tacticalpro.app/web/...   → redirige a la raíz, para que los enlaces antiguos sigan funcionando
// En el código fuente la web sigue en public/web con enlaces a "../" (la app), así el servidor de desarrollo no cambia.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist', app = join(dist, 'app'), web = join(app, 'web')
cpSync(web, dist, { recursive: true })
rmSync(web, { recursive: true })
for (const f of readdirSync(dist).filter((x) => x.endsWith('.html'))) {
  const p = join(dist, f)
  // Los enlaces a la app y a sus iconos ("../algo") pasan a "app/algo".
  writeFileSync(p, readFileSync(p, 'utf8').replace(/(href|src)="\.\.\/([^"]*)"/g, '$1="app/$2"'))
}
// Enlaces antiguos /web/ y /web/privacidad.html
mkdirSync(join(dist, 'web'), { recursive: true })
const go = (to) => `<!doctype html><meta charset="utf-8"><title>TacticalPro</title><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0; url=${to}"><script>location.replace(${JSON.stringify(to)} + location.hash)</script><a href="${to}">TacticalPro</a>\n`
writeFileSync(join(dist, 'web', 'index.html'), go('../'))
writeFileSync(join(dist, 'web', 'privacidad.html'), go('../privacidad.html'))
console.log('web en la raíz, app en /app/')
