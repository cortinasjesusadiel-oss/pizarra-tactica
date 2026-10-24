// Solo en la pizarra personal (rama Pro): capturas y comprobaciones de las funciones Pro.
// La web no tiene este archivo. Se usa con: node scripts/control.mjs ... --mode mia
export const scenes = ({ btn, wait }) => [
  ['pro-bienvenida', async () => {}, { keepWelcome: true }],
  ['pro-tiempo-real', async (p) => { await btn(p, '▶ Tiempo real').click(); await wait(p, 800) }],
]

export const checks = ({ btn, wait, settle, board }) => [
  ['Pro: se ven «● Grabar» y «▶ Tiempo real»', 'pc', async (p, ok) => {
    ok(await btn(p, '● Grabar').count() === 1 && await btn(p, '▶ Tiempo real').count() === 1)
  }],
  ['Pro: «▶ Tiempo real» pasa la jugada a tiempo real y «Volver a pasos» la devuelve', 'pc', async (p, ok) => {
    await btn(p, '▶ Tiempo real').click(); await settle(p)
    const live = !!(await board(p)).clip && await btn(p, 'Volver a pasos').count() === 1
    await btn(p, 'Volver a pasos').click(); await settle(p)
    ok(live && !(await board(p)).clip)
  }],
  ['Pro: «Fichas» ofrece Camiseta élite, Aluminio técnico y Perfil táctico', 'pc', async (p, ok) => {
    await p.locator('.top-group').first().click(); await p.getByRole('menuitem', { name: /^Fichas/ }).click(); await settle(p)
    const txt = await p.locator('.sheet').textContent()
    ok(['Camiseta élite', 'Aluminio técnico', 'Perfil táctico'].every((w) => txt.includes(w)))
  }],
  ['Pro: con «● Grabar», arrastrar un jugador graba la jugada en tiempo real', 'pc', async (p, ok) => {
    await btn(p, '● Grabar').click()
    await wait(p, 3600)
    // Un jugador de verdad (no el balón ni las «sombras» del paso anterior).
    const id = (await board(p)).tokens.find((t) => t.kind === 'player').id
    const b = await p.locator(`.board [data-token="${id}"]`).first().boundingBox()
    const x = b.x + b.width / 2, y = b.y + b.height / 2
    await p.mouse.move(x, y); await p.mouse.down()
    for (let i = 1; i <= 20; i++) { await p.mouse.move(x + i * 6, y + i * 3); await wait(p, 40) }
    await p.mouse.up(); await wait(p, 300)
    await btn(p, '■ Parar').click(); await settle(p)
    const clip = (await board(p))?.clip
    ok(!!clip && Object.values(clip.tracks).some((tr) => tr.length > 5))
  }],
  ['Pro: camiseta PRO junto al logo', 'pc', async (p, ok) => { ok(await p.locator('.brand .pro-shirt').count() === 1) }],
]
