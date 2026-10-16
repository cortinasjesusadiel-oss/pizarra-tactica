// Después del build: la web (public/web) pasa a la raíz del sitio y la pizarra queda en /pizarra/.
//   tacticalpro.app/            → la web, la dirección para compartir
//   tacticalpro.app/pizarra/    → la pizarra
//   tacticalpro.app/app/        → redirige a /pizarra/ (dirección anterior)
//   tacticalpro.app/web/...     → redirige a la raíz, para que los enlaces antiguos sigan funcionando
// En el código fuente la web sigue en public/web con enlaces a "../" (la app), así el servidor de desarrollo no cambia.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist', app = join(dist, 'pizarra'), web = join(app, 'web')
cpSync(web, dist, { recursive: true })
rmSync(web, { recursive: true })
for (const f of readdirSync(dist).filter((x) => x.endsWith('.html'))) {
  const p = join(dist, f)
  // Los enlaces a la pizarra y a sus iconos ("../algo") pasan a "pizarra/algo".
  writeFileSync(p, readFileSync(p, 'utf8').replace(/(href|src)="\.\.\/([^"]*)"/g, '$1="pizarra/$2"'))
}
// Versión en inglés (en/): sus enlaces a la pizarra son "../../algo" y pasan a "../pizarra/algo".
for (const f of readdirSync(join(dist, 'en')).filter((x) => x.endsWith('.html'))) {
  const p = join(dist, 'en', f)
  writeFileSync(p, readFileSync(p, 'utf8').replace(/(href|src)="\.\.\/\.\.\/([^"]*)"/g, '$1="../pizarra/$2"'))
}
// Enlaces antiguos /web/ y /web/privacidad.html
mkdirSync(join(dist, 'web'), { recursive: true })
// `clean` quita el modo sin conexión que la pizarra dejó registrado en la dirección anterior.
const go = (to, clean = false) => `<!doctype html><meta charset="utf-8"><title>TacticalPro</title><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0; url=${to}"><script>${clean ? "navigator.serviceWorker&&navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){if(/\\/app\\/$/.test(x.scope))x.unregister()})});" : ''}location.replace(${JSON.stringify(to)} + location.hash)</script><a href="${to}">TacticalPro</a>\n`
writeFileSync(join(dist, 'web', 'index.html'), go('../'))
writeFileSync(join(dist, 'web', 'privacidad.html'), go('../privacidad.html'))
// Dirección anterior de la pizarra
mkdirSync(join(dist, 'app'), { recursive: true })
writeFileSync(join(dist, 'app', 'index.html'), go('../pizarra/', true))
// La app instalada se abre en /pizarra/instalada/: la misma pizarra (con <base> a la carpeta de arriba),
// así el recuento anónimo distingue la app instalada de la pizarra abierta en el navegador.
mkdirSync(join(dist, 'pizarra', 'instalada'), { recursive: true })
writeFileSync(join(dist, 'pizarra', 'instalada', 'index.html'), readFileSync(join(dist, 'pizarra', 'index.html'), 'utf8').replace('<head>', '<head>\n    <base href="../" />'))
console.log('web en la raíz, pizarra en /pizarra/')
