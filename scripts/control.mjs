// Red de seguridad para ordenar el código sin cambiar nada de lo que se ve ni de lo que hace.
//
//   node scripts/control.mjs capturas --guardar <carpeta>   saca las capturas de control
//   node scripts/control.mjs capturas --comparar <carpeta>  las vuelve a sacar y las compara píxel a píxel
//   node scripts/control.mjs botones                        comprueba lo que hace cada botón
//
// Opciones: --mode mia (pizarra personal), --solo <texto> (solo las capturas cuyo nombre lo contenga).
// Arranca la app con Vite en este mismo proceso y usa Playwright con Chromium (no hace falta internet).
// Si algo no sale igual, termina con error y deja las diferencias marcadas en rojo en <carpeta>/diferencias.
import { createServer } from 'vite'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const args = process.argv.slice(2)
const cmd = args[0]
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined }
const mode = opt('--mode') ?? 'development'
const solo = opt('--solo')

async function loadPlaywright() {
  try { return await import('playwright') } catch { /* no está en el proyecto */ }
  const root = execSync('npm root -g').toString().trim()
  return import(pathToFileURL(join(root, 'playwright', 'index.mjs')).href)
}

// Tres pantallas: computador, celular de pie y celular de lado.
const VIEWS = {
  pc: { viewport: { width: 1366, height: 800 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  pie: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  lado: { viewport: { width: 915, height: 412 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}

const wait = (p, ms = 350) => p.waitForTimeout(ms)
const btn = (p, name) => p.getByRole('button', { name, exact: true }).filter({ visible: true }).first()
// Un botón que en el celular de pie está dentro de «Más».
async function clickOrMore(p, name) {
  const b = btn(p, name)
  if (await b.count()) return b.click()
  await btn(p, 'Más ▾').click(); await wait(p, 150)
  await p.getByRole('menuitem', { name, exact: true }).click()
}
const topMenu = async (p, i) => { await p.locator('.top-group').filter({ visible: true }).nth(i).click() }
const menuItem = (p, name) => p.getByRole('menuitem', { name, exact: true }).or(p.getByRole('menuitemradio', { name, exact: true })).first().click()
const tapFirstToken = async (p) => {
  // La primera ficha de verdad (las «sombras» del paso anterior no se pueden elegir).
  const b = await p.locator('.board .token:not([data-token^="ghost-"])').first().boundingBox()
  await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
}

// Cada escena empieza en una página nueva, con el dispositivo limpio.
const SCENES = [
  ['inicio', async () => {}],
  ['paso-3', async (p) => { await btn(p, 'Paso siguiente').click(); await wait(p); await btn(p, 'Paso siguiente').click() }],
  ['ficha-elegida', async (p) => { await tapFirstToken(p) }],
  ['menu-campo', async (p) => { await topMenu(p, 0) }],
  ['menu-biblioteca', async (p) => { await topMenu(p, 1) }],
  ['menu-pases', async (p) => { await p.locator('.tool-group').first().click() }],
  ['plantillas', async (p) => { await topMenu(p, 1); await menuItem(p, 'Plantillas') }],
  ['sesiones', async (p) => { await topMenu(p, 1); await menuItem(p, 'Sesiones') }],
  ['fundamentos', async (p) => { await topMenu(p, 1); await menuItem(p, 'Fundamentos') }],
  ['consejos', async (p) => { await topMenu(p, 1); await menuItem(p, 'Consejos') }],
  ['fichas', async (p) => { await topMenu(p, 0); await p.getByRole('menuitem', { name: /^Fichas/ }).click() }],
  ['ayuda', async (p) => { await btn(p, 'Ayuda').click() }],
  ['exportar', async (p) => { await btn(p, 'Exportar').click() }],
  ['identidad', async (p) => { await btn(p, 'Mi identidad').click() }],
  ['jugadas', async (p) => { await clickOrMore(p, 'Jugadas') }],
  ['material', async (p) => { await clickOrMore(p, '+ Material') }],
  ['proyectar', async (p) => { await clickOrMore(p, 'Proyectar') }],
  ['pizarra-vacia', async (p) => { await btn(p, '+ Nueva').click() }],
  ['ingles', async (p) => { await p.locator('#lang').selectOption('en') }],
  ['nota-grande', async (p) => { await btn(p, 'Ampliar la explicación del paso').click() }],
]

async function openApp(browser, url, view, o = {}) {
  const ctx = await browser.newContext({ ...VIEWS[view], locale: 'es-CO', timezoneId: 'Europe/Madrid', reducedMotion: 'reduce', colorScheme: 'dark' })
  await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (r) => r.abort())
  await ctx.addInitScript(() => {
    if (sessionStorage.getItem('control')) return
    localStorage.clear(); localStorage.setItem('pizarra.ayuda.v2', '1'); sessionStorage.setItem('control', '1')
  })
  // Reloj fijo: fechas iguales en todas las capturas.
  await ctx.addInitScript(() => { const T = Date.parse('2026-10-24T10:00:00Z'); const D = Date; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [T])) } static now() { return T } } })
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.goto(url)
  await p.waitForSelector('.board .token')
  await p.waitForLoadState('networkidle') // imágenes y partes que se cargan después
  const welcome = p.locator('.welcome')
  if (!o.keepWelcome && await welcome.count()) { await welcome.click(); await wait(p) }
  await p.evaluate(() => document.fonts.ready)
  await wait(p, 500)
  return { ctx, p, errors }
}

async function withApp(fn) {
  const server = await createServer({ mode, logLevel: 'error', server: { port: 0, host: '127.0.0.1' }, clearScreen: false })
  await server.listen()
  const url = server.resolvedUrls.local[0]
  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch()
  try { return await fn(browser, url) } finally { await browser.close(); await server.close() }
}

async function shoot(dir) {
  mkdirSync(dir, { recursive: true })
  const names = []
  await withApp(async (browser, url) => {
    for (const view of Object.keys(VIEWS)) {
      for (const [name, act, o] of SCENES) {
        const file = `${view}-${name}.png`
        if (solo && !file.includes(solo)) continue
        const { ctx, p, errors } = await openApp(browser, url, view, o)
        try {
          await act(p); await wait(p, 600)
          await p.mouse.move(0, 0)
          // Se repite la foto hasta que dos seguidas salen iguales: así no cuenta nada que aún se esté colocando.
          let shot = await p.screenshot({ animations: 'disabled', caret: 'hide' })
          for (let i = 0; i < 6; i++) {
            await wait(p, 400)
            const again = await p.screenshot({ animations: 'disabled', caret: 'hide' })
            if (again.equals(shot)) break
            shot = again
          }
          writeFileSync(join(dir, file), shot)
          if (errors.length) throw new Error(errors.join('\n'))
          names.push(file); process.stdout.write('.')
        } catch (e) { console.error(`\n${file}: ${e.message}`); process.exitCode = 1 } finally { await ctx.close() }
      }
    }
  })
  console.log(`\n${names.length} capturas en ${dir}`)
  return names
}

// Compara dos PNG en el navegador: cuenta los píxeles que cambian de verdad (más de 2 tonos) y pinta en rojo dónde están.
async function diff(browser, a, b, out) {
  const p = await browser.newPage()
  const r = await p.evaluate(async ([a, b]) => {
    const img = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + src })
    const [ia, ib] = await Promise.all([img(a), img(b)])
    if (ia.width !== ib.width || ia.height !== ib.height) return { n: -1 }
    const data = (i) => { const c = new OffscreenCanvas(i.width, i.height), x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height) }
    const da = data(ia), db = data(ib); let n = 0
    for (let k = 0; k < da.data.length; k += 4) {
      // Un cambio de 1 o 2 tonos sobre 255 no se ve: es el redondeo del dibujo de Chromium, que varía entre arranques.
      const same = [0, 1, 2, 3].every((c) => Math.abs(da.data[k + c] - db.data[k + c]) <= 2)
      if (!same) { n++; da.data[k] = 255; da.data[k + 1] = 0; da.data[k + 2] = 0; da.data[k + 3] = 255 } else { da.data[k + 3] = 60 }
    }
    if (!n) return { n }
    const c = new OffscreenCanvas(ia.width, ia.height); c.getContext('2d').putImageData(da, 0, 0)
    const blob = await c.convertToBlob({ type: 'image/png' }); const buf = new Uint8Array(await blob.arrayBuffer())
    let s = ''; for (const v of buf) s += String.fromCharCode(v)
    return { n, png: btoa(s) }
  }, [readFileSync(a).toString('base64'), readFileSync(b).toString('base64')])
  await p.close()
  if (r.png) writeFileSync(out, Buffer.from(r.png, 'base64'))
  return r.n
}

async function compare(base) {
  const now = join(base, 'nuevas'), dd = join(base, 'diferencias')
  rmSync(now, { recursive: true, force: true }); rmSync(dd, { recursive: true, force: true }); mkdirSync(dd, { recursive: true })
  const names = await shoot(now)
  const old = readdirSync(base).filter((f) => f.endsWith('.png') && (!solo || f.includes(solo)))
  const bad = []
  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch()
  for (const f of old) {
    if (!names.includes(f)) { bad.push(`${f}: no se pudo sacar`); continue }
    const n = await diff(browser, join(base, f), join(now, f), join(dd, f))
    if (n) bad.push(`${f}: ${n < 0 ? 'cambió de tamaño' : `${n} píxeles distintos`}`)
  }
  for (const f of names) if (!old.includes(f)) bad.push(`${f}: captura nueva sin referencia`)
  await browser.close()
  if (bad.length) { console.error(`\nNO son iguales:\n- ${bad.join('\n- ')}\nDiferencias en rojo: ${dd}`); process.exitCode = 1 }
  else { console.log(`Las ${old.length} capturas son idénticas píxel a píxel (sin contar variaciones invisibles de 1-2 tonos).`); rmSync(dd, { recursive: true, force: true }) }
}

// ---------- Lo que hace cada botón ----------
const board = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('pizarra.ultima.v1') ?? 'null'))
const count = async (p, pred) => (await board(p)).tokens.filter(pred).length
const isTeam = (team) => (t) => t.kind === 'player' && t.team === team
const drawn = async (p) => { const b = await board(p); return b.drawings.length + (b.frames ?? []).reduce((s, f) => s + (f.drawings?.length ?? 0), 0) }
const steps = (p) => p.locator('.steps button').count()
const activeStep = (p) => p.locator('.steps button.on').textContent()
const settle = (p) => wait(p, 400)
async function dragOnPitch(p, fx1, fy1, fx2, fy2) {
  const r = await p.locator('.board').boundingBox()
  await p.mouse.move(r.x + r.width * fx1, r.y + r.height * fy1); await p.mouse.down()
  for (let i = 1; i <= 8; i++) await p.mouse.move(r.x + r.width * (fx1 + (fx2 - fx1) * i / 8), r.y + r.height * (fy1 + (fy2 - fy1) * i / 8))
  await p.mouse.up()
}

const CHECKS = [
  ['«+ Local», «+ Rival» y «+ Balón» añaden una ficha de cada', 'pc', async (p, ok) => {
    const h = await count(p, isTeam('home')), a = await count(p, isTeam('away')), bl = await count(p, (t) => t.kind === 'ball')
    await btn(p, 'Añadir jugador local').click(); await btn(p, 'Añadir jugador rival').click(); await btn(p, '+ Balón').click(); await settle(p)
    ok(await count(p, isTeam('home')) === h + 1 && await count(p, isTeam('away')) === a + 1 && await count(p, (t) => t.kind === 'ball') === bl + 1)
  }],
  ['«↶» deshace y «↷» rehace', 'pc', async (p, ok) => {
    const n = (await board(p)).tokens.length
    await btn(p, 'Añadir jugador local').click(); await settle(p)
    await btn(p, 'Deshacer').click(); await settle(p); const undone = (await board(p)).tokens.length
    await btn(p, 'Rehacer').click(); await settle(p)
    ok(undone === n && (await board(p)).tokens.length === n + 1)
  }],
  ['Elegir una ficha y «Eliminar» la quita', 'pc', async (p, ok) => {
    const n = (await board(p)).tokens.length
    await tapFirstToken(p); await btn(p, 'Eliminar').click(); await settle(p)
    ok((await board(p)).tokens.length === n - 1)
  }],
  ['«+ Paso» añade un paso y «Quitar paso» lo quita', 'pc', async (p, ok) => {
    const n = await steps(p)
    await btn(p, '+ Paso').click(); await settle(p); const more = await steps(p)
    await btn(p, 'Quitar paso').click(); await settle(p)
    ok(more === n + 1 && await steps(p) === n)
  }],
  ['«›» y «‹» cambian de paso', 'pc', async (p, ok) => {
    await btn(p, 'Paso siguiente').click(); await settle(p); const s2 = await activeStep(p)
    await btn(p, 'Paso anterior').click(); await settle(p)
    ok(s2 === '2' && await activeStep(p) === '1')
  }],
  // Con «menos movimiento» activado en el aparato, Reproducir salta directo al último paso.
  ['«Reproducir» llega al último paso', 'pc', async (p, ok) => {
    const n = await steps(p)
    await btn(p, 'Reproducir').click(); await settle(p)
    ok(await activeStep(p) === String(n))
  }],
  ['Dibujar un pase con la herramienta «Pases» lo guarda', 'pc', async (p, ok) => {
    const n = await drawn(p)
    await p.locator('.tool-group').first().click(); await menuItem(p, 'Pase')
    await dragOnPitch(p, 0.3, 0.8, 0.6, 0.85); await settle(p)
    ok(await drawn(p) === n + 1)
  }],
  ['«Borrar trazos» quita los trazos del paso', 'pc', async (p, ok) => {
    await p.locator('.tool-group').first().click(); await menuItem(p, 'Pase')
    await dragOnPitch(p, 0.3, 0.8, 0.6, 0.85); await settle(p)
    const before = await drawn(p)
    await btn(p, 'Borrar trazos').click(); await settle(p)
    ok(before > 0 && await drawn(p) < before)
  }],
  ['Arrastrar una ficha con «Mover» la cambia de sitio', 'pc', async (p, ok) => {
    const before = JSON.stringify(await board(p))
    const b = await p.locator('.board .token:not([data-token^="ghost-"])').first().boundingBox()
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down()
    for (let i = 1; i <= 8; i++) await p.mouse.move(b.x + b.width / 2 + i * 6, b.y + b.height / 2 + i * 4)
    await p.mouse.up(); await settle(p)
    ok(JSON.stringify(await board(p)) !== before)
  }],
  ['«+ Nueva» deja la pizarra vacía y «↶» la recupera', 'pc', async (p, ok) => {
    const n = (await board(p)).tokens.length
    await btn(p, '+ Nueva').click(); await settle(p); const empty = (await board(p)).tokens.length
    await btn(p, 'Deshacer').click(); await settle(p)
    ok(empty < n && (await board(p)).tokens.length === n)
  }],
  ['Elegir una plantilla la abre en la pizarra', 'pc', async (p, ok) => {
    const before = JSON.stringify((await board(p)).tokens)
    await topMenu(p, 1); await menuItem(p, 'Plantillas'); await settle(p)
    await p.locator('.sheet button.row').filter({ visible: true }).nth(1).click(); await settle(p)
    ok(JSON.stringify((await board(p)).tokens) !== before)
  }],
  ['Cambiar a inglés traduce los botones', 'pc', async (p, ok) => {
    await p.locator('#lang').selectOption('en'); await settle(p)
    ok(await btn(p, '+ New').count() === 1)
  }],
  ['El botón de orientación gira el campo', 'pc', async (p, ok) => {
    const v0 = await p.locator('.board > g[transform]').count()
    await btn(p, 'Orientación del campo').click(); await settle(p)
    ok(v0 === 0 && await p.locator('.board > g[transform]').count() === 1)
  }],
  ['Lo hecho sigue ahí al volver a abrir la app', 'pc', async (p, ok) => {
    await btn(p, 'Añadir jugador local').click(); await settle(p)
    const n = (await board(p)).tokens.length
    await p.reload(); await p.waitForSelector('.board .token'); await settle(p)
    ok((await board(p)).tokens.length === n && await p.locator('.board .token').count() >= n - 2)
  }],
  ['Celular de pie: el campo va en vertical', 'pie', async (p, ok) => { ok(await p.locator('.board > g[transform]').count() === 1) }],
  ['Celular de lado: campo en horizontal y controles de pasos a la izquierda', 'lado', async (p, ok) => {
    const a = await p.locator('.animbar').boundingBox(), s = await p.locator('.stage').boundingBox()
    ok(await p.locator('.board > g[transform]').count() === 0 && a.x < s.x && s.height > 400)
  }],
  ['Al girar el celular se mantienen el paso y la ficha elegida', 'pie', async (p, ok) => {
    await btn(p, 'Paso siguiente').click(); await settle(p); await tapFirstToken(p); await settle(p)
    await p.setViewportSize(VIEWS.lado.viewport); await settle(p)
    const side = await p.locator('.step-count').textContent(), sel = await p.locator('.selbar').count()
    await p.setViewportSize(VIEWS.pie.viewport); await settle(p)
    ok(side?.startsWith('2/') && sel === 1 && await activeStep(p) === '2' && await p.locator('.selbar').count() === 1)
  }],
]

async function checks() {
  let fails = 0
  await withApp(async (browser, url) => {
    for (const [name, view, fn] of CHECKS) {
      if (solo && !name.includes(solo)) continue
      const { ctx, p, errors } = await openApp(browser, url, view)
      let pass = false
      try { await fn(p, (v) => { pass = !!v }); if (errors.length) { pass = false; console.error(errors.join('\n')) } } catch (e) { console.error(e.message) }
      console.log(`${pass ? '✓' : '✗'} ${name}`)
      if (!pass) fails++
      await ctx.close()
    }
  })
  console.log(fails ? `\n${fails} comprobaciones fallaron` : '\nTodas las comprobaciones pasan')
  if (fails) process.exitCode = 1
}

// Enchufe: una rama puede añadir sus propias capturas y comprobaciones en scripts/control-extra.mjs
// (exporta scenes(h) y checks(h), que devuelven listas con la misma forma que SCENES y CHECKS).
const extra = fileURLToPath(new URL('./control-extra.mjs', import.meta.url))
if (existsSync(extra)) {
  const x = await import(pathToFileURL(extra).href)
  const h = { btn, wait, settle, board, steps, activeStep, topMenu, menuItem, tapFirstToken, clickOrMore }
  SCENES.push(...(x.scenes?.(h) ?? []))
  CHECKS.push(...(x.checks?.(h) ?? []))
}

if (cmd === 'capturas' && opt('--guardar')) await shoot(resolve(opt('--guardar')))
else if (cmd === 'capturas' && opt('--comparar')) {
  const d = resolve(opt('--comparar'))
  if (!existsSync(d)) { console.error(`No existe ${d}`); process.exit(1) }
  await compare(d)
} else if (cmd === 'botones') await checks()
else { console.log('Uso: node scripts/control.mjs capturas --guardar <carpeta> | capturas --comparar <carpeta> | botones  [--mode mia] [--solo texto]'); process.exitCode = 1 }
