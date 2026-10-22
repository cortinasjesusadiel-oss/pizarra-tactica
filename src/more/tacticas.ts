// Más jugadas tácticas animadas de equipo completo (fútbol 11).
// Campo completo: nuestro equipo (amarillo) ataca hacia la derecha y defiende la portería de x=0.
// Medio campo: x=0 es la línea central y la portería rival está en (52.5, 34).
import { ballAt, line, player, type Board, type Drawing, type Pt, type Token } from '../model'
import { animate, press, type Step, type Template } from '../anim'
import { t } from '../i18n'

export type Shape = Record<string, Pt>
// Una flecha de movimiento: el nombre de la ficha y, si hace falta, puntos intermedios para curvarla.
type Mv = string | [string, ...Pt[]]

// Un paso, escrito de forma corta. Las flechas (pase, conducción, carrera, presión) se dibujan
// solas en el paso anterior, desde donde estaba cada ficha hasta donde está en este paso.
export interface S {
  n: string // nota del paso
  m?: Shape // fichas que se mueven
  b?: string | Pt // quién tiene el balón (o dónde está el balón si no lo tiene nadie)
  d?: 1 | -1 // hacia dónde mira el que tiene el balón (por defecto, hacia la portería que ataca)
  s?: boolean // robo: el balón cambia de dueño sin flecha de pase
  dv?: Pt[] // puntos intermedios de la conducción
  run?: Mv[] // carreras (amarillo)
  pr?: Mv[] // salidas a presionar (rojo)
}

// Las fichas de casa se llaman h + dorsal (h9 es el 9). El portero rival se llama g. Si un rival se llama
// r + dorsal (r9), lleva ese dorsal; los demás rivales van sin número.
function cast(home: Shape, away: Shape, ball: Pt): Record<string, Token> {
  const c: Record<string, Token> = {}
  for (const [k, [x, y]] of Object.entries(home)) c[k] = player('home', k.slice(1), x, y)
  for (const [k, [x, y]] of Object.entries(away)) c[k] = player('away', k === 'g' ? '1' : /^r\d+$/.test(k) ? k.slice(1) : '', x, y)
  c.b = ballAt(...ball)
  return c
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])
const cp = (p: Pt): Pt => [p[0], p[1]]

function play(pitch: Board['pitch'], home: Shape, away: Shape, b0: string | Pt, specs: S[], extra: Token[] = []): Board {
  let pos: Shape = { ...home, ...away }
  const dirOf = (h: string | Pt, d?: 1 | -1) => d ?? (typeof h === 'string' && h in away ? -1 : 1)
  // Balón a los pies, un poco adelantado hacia donde mira el jugador.
  const ballOf = (h: string | Pt, d: number, p: Shape): Pt => (typeof h === 'string' ? [p[h][0] + 0.9 * d, p[h][1] + 0.4] : cp(h))
  let holder = b0
  let ball = ballOf(b0, dirOf(b0, specs[0].d), pos)
  const c = cast(home, away, ball)
  const steps: Step[] = []
  specs.forEach((s, i) => {
    const prev = pos
    pos = { ...pos, ...(s.m ?? {}) }
    const path = (r: Mv): Pt[] => {
      const [k, ...via] = typeof r === 'string' ? [r] : r
      return [cp(prev[k]), ...via.map(cp), cp(pos[k])]
    }
    const h = s.b ?? holder
    const nb = i ? ballOf(h, dirOf(h, s.d), pos) : ball
    if (i) {
      const dr = steps[i - 1].draw!
      if (h !== holder) {
        if (!s.s) dr.push(line('pass', [cp(ball), cp(nb)]))
      } else if (typeof h === 'string' && dist(prev[h], pos[h]) > 0.5) dr.push(line('dribble', [cp(prev[h]), ...(s.dv ?? []).map(cp), cp(pos[h])]))
      for (const r of s.run ?? []) dr.push(line('run', path(r)))
      for (const r of s.pr ?? []) dr.push(press(path(r)))
    }
    const move: Record<string, Pt> = {}
    for (const [k, p] of Object.entries(s.m ?? {})) move[k] = cp(p)
    steps.push({ note: s.n, move: i ? { ...move, b: nb } : undefined, draw: [] as Drawing[] })
    holder = h
    ball = nb
  })
  return animate(pitch, c, steps, extra)
}

export const T = (id: string, group: Template['group'], name: string, pitch: Board['pitch'], home: Shape, away: Shape, b0: string | Pt, specs: S[], extra: () => Token[] = () => []): Template => ({
  id, group, name, animated: true, build: () => play(pitch, home, away, b0, specs, extra()),
})

// ---------- Generar espacios: ataque posicional ----------

const salida3 = T('t2-salida-3', 'Generar espacios', t('Salida de balón con 3: el pivote se mete entre los centrales'), 'full',
  { h1: [5, 34], h5: [17, 25], h4: [17, 43], h6: [26, 34], h3: [30, 6], h2: [30, 62], h8: [40, 21], h10: [41, 47], h11: [54, 8], h7: [54, 60], h9: [58, 34] },
  { a1: [27, 27], a2: [27, 41], m1: [42, 13], m2: [38, 28], m3: [38, 40], m4: [42, 55], d1: [64, 12], d2: [66, 27], d3: [66, 41], d4: [64, 56], g: [100, 34] },
  'h1', [
    { n: t('Salida de balón desde el portero. Los dos delanteros rivales presionan a nuestros dos centrales: 2 contra 2, así es difícil salir.') },
    { n: t('El pivote (6) baja y se mete entre los centrales, que se abren hacia las bandas. Los laterales suben. Ahora somos 3 contra 2: si nos colocamos bien, uno debería quedar libre.'), m: { h6: [15, 34], h5: [11, 15], h4: [11, 53], h3: [36, 5], h2: [36, 63], a1: [20, 24], a2: [20, 44] }, run: ['h6', 'h5', 'h4', 'h3', 'h2'] },
    { n: t('Pase al central izquierdo (5). Un delantero sale a por él y el otro se queda vigilando al central derecho. El 6 está libre en el centro.'), b: 'h5', m: { a1: [15, 19.5], a2: [18, 42] }, pr: ['a1'] },
    { n: t('El 6 recibe libre. El segundo delantero tiene que salir a por él… y deja solo al central derecho (4).'), b: 'h6', m: { a2: [18.5, 37] }, pr: ['a2'] },
    { n: t('Pase al 4, que tiene campo por delante. Nadie le presiona: puede avanzar conduciendo.'), b: 'h4' },
    { n: t('El 4 conduce y atrae a un centrocampista rival, que sale de su sitio para pararle. Al salir, deja libre a nuestro lateral.'), m: { h4: [25, 52], m4: [31, 53], m3: [36, 44] }, pr: ['m4'] },
    { n: t('Pase al lateral (2), solo en banda. Con 3 atrás contra 2 delanteros es más fácil que el balón salga limpio: la clave es que el que queda libre lo vea y avance.'), b: 'h2' },
  ])

const lateralDentro = T('t2-lateral-dentro', 'Generar espacios', t('Lateral por dentro (lateral invertido)'), 'full',
  { h1: [8, 34], h5: [28, 22], h4: [28, 46], h6: [38, 34], h3: [40, 6], h2: [36, 60], h8: [50, 22], h10: [52, 44], h11: [70, 5], h9: [78, 34], h7: [68, 63] },
  { f1: [46, 29], f2: [46, 40], m1: [58, 13], m2: [57, 27], m3: [57, 41], m4: [58, 55], d1: [73, 12], d2: [75, 27], d3: [75, 41], d4: [73, 56], g: [100, 34] },
  'h5', [
    { n: t('Salimos contra un 4-4-2. Nuestro lateral derecho (2) está abierto y el extremo rival de ese lado le vigila.') },
    { n: t('El lateral (2) se mete por dentro, al lado del pivote. El extremo (7) se queda muy abierto. El extremo rival duda: ¿sigue al lateral o se queda con el extremo?'), m: { h2: [42, 44], m4: [55, 50] }, run: ['h2'] },
    { n: t('Pase al central. El extremo rival se mete por dentro para tapar al lateral… y deja solo a nuestro extremo en la banda.'), b: 'h4', m: { m4: [49, 46] } },
    { n: t('Pase largo al extremo, que recibe solo y con espacio para encarar al lateral rival. Regla: si el rival sigue al lateral por dentro, el balón va fuera; si se queda fuera, el balón entra por dentro al lateral.'), b: 'h7', m: { h7: [64, 62], d4: [70, 58] } },
  ])

const intervalo = T('t2-intervalo', 'Generar espacios', t('Atacar el hueco entre central y lateral'), 'half',
  { h6: [14, 34], h2: [22, 60], h7: [36, 65], h8: [24, 48], h10: [30, 26], h9: [40, 34], h11: [38, 6] },
  { m1: [29, 19], m2: [28, 33], m3: [29, 43], m4: [30, 57], d1: [40, 14], d2: [41, 28], d3: [41, 40], d4: [40, 53], g: [51, 34] },
  'h2', [
    { n: t('El extremo (7) está muy abierto, pegado a la banda. Así obliga al lateral rival a separarse de su central.') },
    { n: t('Pase al extremo. El lateral rival sale a por él y se abre un hueco entre el lateral y el central: el intervalo.'), b: 'h7', m: { d4: [38, 59], m4: [32, 60] }, pr: ['d4'] },
    { n: t('El interior (8) corre por ese hueco y el extremo le da el pase en profundidad. Recibe dentro del área.'), b: 'h8', m: { h8: [44, 50], d4: [37, 62], m3: [33, 46], d3: [42, 42] }, run: ['h8'], pr: ['d4'] },
    { n: t('El central sale a por el 8 y deja libre la zona del primer palo. El 9 y el 10 atacan el área.'), m: { d3: [43.5, 44.5], h9: [47, 37], h10: [40, 31], d2: [44, 31] }, pr: ['d3'], run: ['h9', 'h10'] },
    { n: t('Pase atrás al 9, que llega solo al primer palo y remata.'), b: 'h9', m: { g: [51, 37.5] } },
    { n: t('Gol. Para atacar el intervalo hace falta que el extremo abra el campo y que alguien corra por dentro en el momento justo.'), b: [52.3, 33.5] },
  ])

const triangulo = T('t2-triangulo-banda', 'Generar espacios', t('Superioridad en banda: triángulo lateral-interior-extremo'), 'half',
  { h6: [14, 34], h3: [18, 8], h8: [25, 19], h11: [33, 4], h10: [32, 30], h9: [40, 32], h7: [38, 60] },
  { e: [26, 10], m1: [32, 23], m2: [26, 32], d1: [38, 10], d2: [42, 25], d3: [43, 38], d4: [41, 51], g: [51, 34] },
  'h3', [
    { n: t('En la banda tenemos 3 (lateral 3, interior 8 y extremo 11) contra 2 rivales. Colocados en triángulo, es más fácil que haya un pase libre.') },
    { n: t('El lateral da el pase al interior. El extremo rival sigue el balón.'), b: 'h8', m: { h8: [25, 17], e: [23, 12] } },
    { n: t('Pase al extremo, que se acerca. El lateral rival sale a por él. A la vez, el 3 corre por fuera (doblaje).'), b: 'h11', m: { h11: [32, 8], d1: [35, 11.5], h3: [28, 3] }, pr: ['d1'], run: ['h3'] },
    { n: t('Pared: el extremo devuelve el balón al espacio, a la espalda del lateral rival. El 3 llega lanzado y recibe solo cerca del área.'), b: 'h3', m: { h3: [42, 5] }, run: ['h3'] },
    { n: t('Centro raso al primer palo, donde llega el 9. El 7 ataca el segundo palo.'), b: 'h9', m: { h9: [47, 29], d3: [46, 35], h7: [44, 42], d4: [44, 46] }, run: ['h9', 'h7'] },
    { n: t('Gol. Triángulo, pared y doblaje: con tres jugadores cerca del balón ganamos al rival en la banda.'), b: [52.3, 31.5], m: { g: [51.5, 33.5] } },
  ])

const cutBack = T('t2-bloque-bajo-pase-atras', 'Generar espacios', t('Atacar un bloque bajo: amplitud y pase atrás'), 'half',
  { h5: [12, 24], h4: [12, 44], h6: [24, 34], h3: [26, 7], h2: [26, 61], h10: [40, 24], h8: [39, 44], h9: [46, 34], h11: [38, 2.5], h7: [37, 65.5] },
  { f1: [29, 28], f2: [29, 40], m1: [35, 17], m2: [34, 28], m3: [34, 40], m4: [35, 51], d1: [44, 19], d2: [45, 29], d3: [45, 39], d4: [44, 49], g: [51, 34] },
  'h6', [
    { n: t('El rival defiende en bloque bajo: 10 jugadores cerca de su área y nada de espacio por dentro. Nuestros extremos (11 y 7) abren el campo al máximo, pegados a la banda.') },
    { n: t('Pase al lateral. El bloque se mueve hacia ese lado, pero tiene que cubrir de banda a banda: los huecos entre ellos se hacen más grandes.'), b: 'h2', m: { m4: [33, 54], d4: [43, 52], f2: [30, 46] } },
    { n: t('Pase al extremo. El lateral rival tiene que salir hasta la banda, lejos de su central.'), b: 'h7', m: { d4: [41, 60], m4: [34, 57] }, pr: ['d4'] },
    { n: t('El interior (8) corre por detrás del lateral rival y recibe en la línea de fondo.'), b: 'h8', m: { h8: [50, 53], d3: [48, 42] }, run: ['h8'] },
    { n: t('Los defensas corren hacia su portería para tapar el centro. Así dejan libre la zona del penalti, detrás de ellos, donde llega el 10.'), m: { d3: [48, 40], d2: [49, 33], d1: [48, 25], g: [51, 38], h9: [50, 44], h10: [41, 35], m2: [36, 31], m3: [38, 41] }, run: ['h9', 'h10'] },
    { n: t('Pase atrás (cut-back) al 10, que llega solo y de cara a la portería.'), b: 'h10' },
    { n: t('Gol. Contra un bloque bajo: amplitud para estirarlo, llegar a la línea de fondo y dar el pase atrás.'), b: [52.3, 35.5] },
  ])

const entreLineas = T('t2-entre-lineas', 'Generar espacios', t('Juego entre líneas: recibir de espaldas y girar'), 'half',
  { h3: [16, 6], h8: [14, 24], h6: [12, 40], h2: [16, 62], h10: [30, 32], h9: [40, 34], h11: [34, 4], h7: [34, 64] },
  { m1: [24, 21], m2: [23, 34], m3: [23, 44], m4: [24, 54], d1: [37, 13], d2: [37, 26], d3: [37, 40], d4: [37, 54], g: [51, 34] },
  'h8', [
    { n: t('El mediapunta (10) se coloca entre la línea de medios y la de defensas rivales, en un hueco donde nadie le marca.') },
    { n: t('Pase al 10, que recibe de espaldas a la portería. El central sale a por él. Antes de recibir, el 10 ha mirado por encima del hombro: sabe que el central viene y por qué lado girar.'), b: 'h10', d: -1, m: { h10: [30, 31], d2: [33.5, 29] }, pr: ['d2'] },
    { n: t('Giro: con el primer toque se lleva el balón hacia el lado contrario del central y se pone de cara. El central ha salido y deja un hueco detrás, que ataca el 9.'), m: { h10: [34, 36.5], d2: [31.5, 31.5], d3: [38, 41], h9: [43, 26] }, run: ['h9'] },
    { n: t('Pase al 9 en el hueco que dejó el central. Queda solo delante del portero.'), b: 'h9', m: { h9: [44, 27], d1: [41, 18], g: [49, 31] } },
    { n: t('Gol. Recibir entre líneas, mirar antes y girar rompe dos líneas del rival con un solo pase.'), b: [52.3, 33], m: { g: [51, 32.5] } },
  ])

const apoyoRuptura = T('t2-apoyo-ruptura', 'Generar espacios', t('Desmarque de apoyo y de ruptura: el 9 viene, el extremo va'), 'half',
  { h6: [14, 34], h8: [22, 24], h10: [26, 46], h9: [40, 34], h11: [34, 4], h7: [36, 60] },
  { m1: [28, 19], m2: [28, 39], m3: [29, 52], d1: [42, 10], d2: [41, 29], d3: [41, 40], d4: [40, 54], g: [51, 34] },
  'h6', [
    { n: t('El 9 está junto a los centrales rivales y así no puede recibir. Pero si viene hacia el balón, arrastra a un defensa.') },
    { n: t('Desmarque de apoyo: el 9 viene hacia el balón. Su central le sigue para no dejarle girar y abre un hueco detrás.'), m: { h9: [32, 32], d2: [35, 30] }, run: ['h9'] },
    { n: t('Pase al 9, que recibe de espaldas con el central encima. No intenta girar: juega de cara con un compañero.'), b: 'h9', d: -1, m: { d2: [34.5, 31], h8: [25, 27] }, run: ['h8'] },
    { n: t('El 9 descarga para el 8, que recibe de cara. Mientras, el extremo (11) empieza su carrera hacia dentro, a la espalda de la defensa.'), b: 'h8', m: { h11: [38, 9] }, run: ['h11'] },
    { n: t('Desmarque de ruptura: pase al espacio y el 11 llega solo dentro del área.'), b: 'h11', m: { h11: [47, 22], d1: [44, 16], g: [50, 28] }, run: ['h11'] },
    { n: t('Gol. Uno viene (apoyo) y otro va (ruptura): así se desordena una defensa.'), b: [52.3, 31.5], m: { g: [51.5, 30.5] } },
  ])

const atraerAcelerar = T('t2-atraer-acelerar', 'Generar espacios', t('Cambio de ritmo: atraer la presión y acelerar'), 'full',
  { h1: [4, 34], h5: [14, 24], h4: [14, 44], h6: [24, 34], h8: [30, 20], h10: [32, 48], h3: [26, 6], h2: [26, 62], h11: [50, 8], h9: [52, 34], h7: [50, 60] },
  { f1: [26, 26], f2: [26, 42], m1: [38, 18], m3: [40, 34], m2: [40, 50], w1: [36, 8], w2: [36, 60], d1: [58, 14], d2: [60, 28], d3: [60, 40], d4: [58, 54], g: [100, 34] },
  'h5', [
    { n: t('Atraer: tocamos atrás con calma, sin prisa, para invitar al rival a presionar.') },
    { n: t('El rival muerde: sube con muchos jugadores a presionar. Detrás de ellos queda mucho espacio.'), b: 'h1', m: { f1: [14, 30], f2: [16, 40], m3: [30, 34], m1: [33, 22], m2: [40, 54], w1: [30, 10], w2: [30, 58], d1: [50, 16], d2: [48, 28], d3: [48, 40], d4: [50, 50] } },
    { n: t('Pase al central. El delantero rival sale a por él.'), b: 'h4', m: { f2: [17, 41.5] }, pr: ['f2'] },
    { n: t('Pase vertical al 10, que esperaba detrás de la primera línea de presión. De un pase hemos dejado atrás a varios rivales.'), b: 'h10' },
    { n: t('Acelerar: ahora sí, rápido. Pase largo a la espalda de la defensa y el 7 corre hacia la portería con espacio.'), b: 'h7', m: { h7: [66, 58], d4: [56, 54], d3: [54, 42] }, run: ['h7'] },
    { n: t('El 7 conduce y el 9 le acompaña por dentro. Los rivales corren hacia atrás, desordenados.'), m: { h7: [80, 52], h9: [80, 40], d3: [74, 44], d2: [70, 32], d4: [72, 54] }, run: ['h9'] },
    { n: t('Pase al 9 para rematar. Lento para atraer al rival, rápido para atacar el espacio que deja.'), b: 'h9', m: { h9: [86, 38], d3: [80, 43] }, run: ['h9'] },
  ])

// ---------- Bloques: defensa ----------

const centros = T('t2-defensa-centros', 'Bloques', t('Defender un centro lateral'), 'full',
  { h1: [2, 36], h2: [22, 56], h4: [12, 42], h5: [12, 32], h3: [12, 22], h6: [20, 34], h8: [22, 26], h10: [24, 46], h7: [32, 58], h11: [30, 14], h9: [42, 34] },
  { rw: [26, 61], n9: [15, 37], ri: [27, 40], lw: [18, 13], rm: [34, 30] },
  'rw', [
    { n: t('El extremo rival conduce hacia la línea de fondo para centrar. Todo el equipo se mete en el área y mira al balón.') },
    { n: t('Cada uno en su sitio: el central de cerca (4) cuida el primer palo, el otro central (5) el centro de la portería, el lateral contrario (3) cierra el segundo palo y el pivote (6) se queda en el punto de penalti para el rechace o el pase atrás. El lateral (2) sale a tapar el centro.'), m: { rw: [12, 61], h2: [14, 58], h4: [6, 39], h5: [8, 32], h3: [7, 24], h6: [15, 33], h8: [19, 26], h10: [20, 45], h1: [2, 37], n9: [10, 38], ri: [18, 40], lw: [11, 17], rm: [28, 32] }, pr: ['h2'], run: ['h4', 'h5', 'h3', 'h6', 'h10'] },
    { n: t('Centro al primer palo. El central llega antes que el delantero porque miraba al balón y al rival a la vez.'), b: 'h4', m: { h4: [7, 37] } },
    { n: t('Despeje de cabeza hacia fuera, lejos de la portería, a un compañero en banda. Evita despejar hacia el centro del área, donde el rival suele llegar a rematar.'), b: 'h10', m: { h10: [24, 50] } },
  ])

const cobertura = T('t2-cobertura-permuta', 'Bloques', t('Cobertura y permuta: si un defensa sale, otro cubre'), 'full',
  { h1: [4, 34], h3: [20, 13], h5: [18, 27], h4: [18, 41], h2: [21, 55], h6: [28, 34], h8: [32, 24], h10: [32, 46], h11: [44, 14], h9: [50, 34], h7: [44, 56] },
  { rw: [34, 61], n9: [21, 34], lw: [22, 8], ri: [30, 48], rm: [40, 32] },
  'rw', [
    { n: t('El extremo rival tiene el balón en banda. Nuestra línea de 4 está ordenada.') },
    { n: t('El lateral (2) sale a presionar al extremo. El central (4) se coloca detrás de él, en diagonal: es la cobertura. Toda la línea se mueve hacia el balón.'), m: { h2: [29, 58], h4: [21, 49], h5: [19, 38], h3: [19, 24], h6: [26, 40] }, pr: ['h2'], run: ['h4', 'h5', 'h3', 'h6'] },
    { n: t('El extremo regatea al lateral y se va hacia dentro. Como había cobertura, el central sale a por él.'), m: { rw: [23, 56], h2: [27, 59] }, dv: [[27, 62]] },
    { n: t('Permuta: el lateral superado no persigue por detrás; corre a ocupar el sitio del central. La línea vuelve a tener 4.'), m: { h4: [21.5, 52.5], h2: [19, 46] }, pr: ['h4'], run: [['h2', [25, 50]]] },
    { n: t('El central roba el balón. Sin cobertura, el extremo se habría quedado solo delante de nuestra portería.'), b: 'h4', s: true, m: { rw: [24, 57] } },
  ])

const achique = T('t2-achique', 'Bloques', t('Achique y fuera de juego tras un pase atrás'), 'full',
  { h1: [5, 34], h3: [18, 12], h5: [17, 28], h4: [17, 40], h2: [18, 56], h6: [26, 34], h8: [30, 22], h10: [30, 46], h11: [36, 10], h7: [36, 58], h9: [44, 34] },
  { r1: [29, 40], r2: [42, 30], r3: [40, 46], n9: [21, 34], lw: [22, 8], rw: [22, 62], rm: [36, 18] },
  'r1', [
    { n: t('Defendemos cerca de nuestra área. El rival, presionado, da un pase hacia atrás.') },
    { n: t('Pase atrás: es la señal. Toda la defensa sube a la vez (achique). Ganamos metros y alejamos al rival de nuestra portería.'), b: 'r2', m: { h3: [24, 12], h5: [24, 28], h4: [24, 40], h2: [24, 56], h6: [32, 34], h8: [36, 24], h10: [34, 44], r1: [32, 40] }, run: ['h3', 'h5', 'h4', 'h2', 'h6', 'h10'], pr: ['h8'] },
    { n: t('La línea sigue subiendo junta. Los delanteros rivales que se quedan detrás de nuestra línea están en fuera de juego.'), m: { h3: [30, 12], h5: [29, 28], h4: [29, 40], h2: [30, 56], h8: [39, 26], h10: [36, 44] }, run: ['h3', 'h5', 'h4', 'h2', 'h10'], pr: ['h8'] },
    { n: t('Pase largo al delantero: fuera de juego, el árbitro pita. Si un solo defensa se queda atrás, el delantero estaría habilitado. Por eso la línea sube junta.'), b: 'n9' },
  ])

// ---------- Presión alta ----------

const presion433 = T('t2-presion-433-pivote', 'Presión alta', t('Presión 4-3-3 al saque de portería: trampa en el pivote'), 'full',
  { h1: [40, 34], h5: [58, 28], h4: [58, 40], h3: [70, 8], h2: [70, 60], h6: [70, 34], h8: [78, 29], h10: [78, 39], h11: [90, 14], h9: [92, 34], h7: [90, 54] },
  { g: [101, 34], c1: [94, 22], c2: [94, 46], p: [86, 34], i1: [80, 22], i2: [80, 46], f1: [84, 6], f2: [84, 62], w1: [66, 8], w2: [66, 60], n: [62, 34] },
  'g', [
    { n: t('Saque de portería rival. Nuestros extremos (11 y 7) se colocan por fuera de los centrales para tapar el pase a los laterales. El pivote rival parece libre… es una trampa.') },
    { n: t('Pase al central. El 7 le presiona desde fuera hacia dentro y el 9 tapa la vuelta al portero. Solo le queda el pase por dentro, al pivote.'), b: 'c2', m: { h7: [91, 50], h9: [95, 37] }, pr: ['h7', 'h9'] },
    { n: t('El pivote recibe de espaldas. Es la señal: tres jugadores saltan a la vez sobre él.'), b: 'p', d: 1, m: { p: [88, 38] } },
    { n: t('El pivote queda rodeado: el 9 por detrás y el 8 y el 10 por los lados. El 10 le roba el balón.'), b: 'h10', s: true, m: { h8: [85, 35], h10: [85.5, 40.5], h9: [91, 38.5] }, pr: ['h8', 'h10', 'h9'] },
    { n: t('El 10 conduce hacia el área. Hemos robado a unos 15 metros de la portería rival.'), m: { h10: [91, 43.5], h9: [96, 35.5], c2: [94, 47] }, run: ['h9'] },
    { n: t('Gol. La trampa: dejamos libre al pivote a propósito y, cuando recibe, saltamos todos a la vez.'), b: [104.7, 36], m: { g: [103, 35] } },
  ])

const presionPortero = T('t2-presion-pase-atras', 'Presión alta', t('Presión tras pase atrás al portero: salto en cadena'), 'full',
  { h1: [30, 34], h3: [54, 10], h5: [50, 28], h4: [50, 40], h2: [54, 58], h11: [72, 12], h8: [66, 28], h6: [66, 40], h7: [74, 56], h9: [84, 30], h10: [80, 42] },
  { g: [101, 34], c1: [88, 24], c2: [90, 44], p: [80, 34], f1: [76, 6], f2: [78, 62], i1: [70, 22], i2: [70, 48], w1: [60, 8], w2: [60, 60], n: [56, 34] },
  'c1', [
    { n: t('El central rival tiene el balón con nuestro 9 cerca. Juega hacia atrás, con su portero. Un pase atrás es la señal para saltar: el balón tarda en llegar y el rival no avanza.'), d: 1 },
    { n: t('Salto en cadena: todos suben a la vez, cada uno a por el rival que tiene delante. El 9 va al portero tapando la vuelta al central, el 11 va al central y el 3 sube al lateral. Los de atrás se juntan.'), b: 'g', m: { h9: [96, 31], h11: [85, 20], h3: [70, 8], h10: [87.5, 42], h8: [76, 32], h7: [76, 57], h6: [68, 43], h5: [57, 16], h4: [52, 32], h2: [56, 50] }, pr: ['h9', 'h11', 'h3', 'h10', 'h8', 'h7'], run: ['h6', 'h5', 'h4', 'h2'] },
    { n: t('Sin pases cortos, el portero tiene que pegar en largo. Nuestro lateral, de cara al balón, lo gana.'), b: 'h2', m: { h2: [57, 50], w2: [61, 53] } },
    { n: t('Recuperamos en campo rival con el rival desordenado. Saltar en cadena es subir todos a la vez: si uno no salta, queda un rival libre y la presión se rompe.'), b: 'h6' },
  ])

// ---------- Transiciones ----------

const contraCorner = T('t2-contra-corner', 'Transiciones', t('Contraataque tras un córner en contra: salir en 3 pases'), 'full',
  { h1: [1.8, 34.5], h2: [1.5, 40], h4: [5, 40], h5: [6, 33], h3: [5, 27], h6: [11, 36], h8: [10, 28], h10: [12, 44], h7: [20, 52], h11: [24, 12], h9: [40, 34] },
  { k: [0.8, 67.2], a1: [9, 39.5], a2: [8, 31], a3: [14, 40], a4: [15, 30], r1: [26, 34], r2: [48, 28], r3: [50, 44], g: [100, 34] },
  'k', [
    { n: t('Córner en contra. Dejamos al 9 arriba y al 7 y al 11 fuera del área, listos para salir. Los demás defienden el área.'), d: 1 },
    { n: t('Centro al primer palo y el 4 gana el balón de cabeza. Primer pase: no lo despeja a cualquier sitio, lo dirige hacia fuera, al 10.'), b: 'h4', m: { h4: [6, 38.5] } },
    { n: t('El 10 recibe fuera del área y de cara. El 7 ya corre por la banda.'), b: 'h10', m: { h10: [16, 48], h7: [28, 58] }, run: ['h7'] },
    { n: t('Segundo pase: al 7, que corre al espacio. El rival tiene a casi todos en nuestra área: arriba solo le quedan dos defensores.'), b: 'h7', m: { h7: [40, 60], h11: [40, 16], r2: [46, 30], r3: [46, 48] }, run: ['h7', 'h11'] },
    { n: t('Tercer pase: al 9, a la espalda de los dos últimos defensores. En tres pases estamos en campo rival.'), b: 'h9', m: { h9: [62, 40], r2: [56, 34], r3: [56, 46], h11: [58, 18], h7: [50, 58] }, run: ['h9', 'h11', 'h7'] },
    { n: t('El 9 conduce hacia la portería con el 11 a su lado. Los rivales corren hacia atrás, pero llegan tarde.'), m: { h9: [82, 38], r2: [76, 34], r3: [76, 42], h11: [80, 24], h7: [72, 56], g: [98, 35] }, run: ['h11', 'h7'] },
    { n: t('Gol. La clave: dejar jugadores rápidos fuera del área en el córner y que el primer pase tras el despeje ya vaya hacia delante.'), b: [104.7, 35.5], m: { g: [103, 35] } },
  ])

// ---------- Sistemas ----------

const de433a325 = T('t2-433-a-325', 'Sistemas', t('Cómo pasa un 4-3-3 a 3-2-5 en ataque'), 'full',
  { h1: [5, 34], h3: [22, 9], h5: [18, 26], h4: [18, 42], h2: [22, 59], h6: [30, 34], h8: [38, 22], h10: [38, 46], h11: [48, 9], h9: [52, 34], h7: [48, 59] },
  {},
  'h5', [
    { n: t('Sin balón somos un 4-3-3: 4 defensas, 3 centrocampistas (6, 8 y 10) y 3 delanteros (11, 9 y 7).') },
    { n: t('Paso 1: el lateral derecho (2) se mete por dentro, al lado del 6. El lateral izquierdo (3) se queda atrás con los centrales: ya tenemos una línea de 3 y dos medios delante.'), m: { h1: [10, 34], h3: [30, 14], h5: [32, 32], h4: [30, 50], h2: [42, 42], h6: [42, 28] }, run: ['h2', 'h3', 'h4', 'h6'] },
    { n: t('Paso 2: los interiores (8 y 10) suben a los pasillos interiores, entre el extremo y el 9. Los extremos (11 y 7) se quedan pegados a la banda.'), b: 'h6', m: { h8: [62, 22], h10: [62, 46], h11: [64, 4], h7: [64, 64], h9: [70, 34] }, run: ['h8', 'h10', 'h11', 'h7', 'h9'] },
    { n: t('Con balón en campo rival: 3-2-5. Tres atrás y dos medios (6 y 2) para frenar un contraataque; cinco arriba, uno en cada carril del campo. Si perdemos el balón, el 2 y el 3 vuelven a su banda y es otra vez un 4-3-3.'), b: 'h8', m: { h1: [16, 34], h3: [42, 16], h5: [40, 34], h4: [42, 52], h6: [52, 28], h2: [52, 42], h8: [66, 20] }, run: ['h3', 'h5', 'h4', 'h6', 'h2'] },
  ])

export const TACTICAS2: Template[] = [
  salida3, lateralDentro, intervalo, triangulo, cutBack, entreLineas, apoyoRuptura, atraerAcelerar,
  centros, cobertura, achique,
  presion433, presionPortero,
  contraCorner,
  de433a325,
]
