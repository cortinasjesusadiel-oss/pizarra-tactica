import { type Board, type Token, type Pt, type Drawing, type Frame, player, ballAt, coneAt, item, line } from './model'

export interface Template {
  id: string
  group: 'Sistemas' | 'ABP' | 'Ejercicios'
  name: string
  animated?: boolean
  build: () => Board
}

// Ayuda para escribir animaciones: las fichas tienen nombre (`cast`) y cada paso dice a dónde se mueven.
interface Step { note: string; move?: Record<string, Pt>; draw?: Drawing[] }
function animate(pitch: Board['pitch'], cast: Record<string, Token>, steps: Step[], extra: Token[] = []): Board {
  const frames: Frame[] = steps.map((s) => ({
    note: s.note,
    drawings: s.draw ?? [],
    pos: Object.fromEntries(Object.entries(s.move ?? {}).map(([k, p]) => [cast[k].id, p])),
  }))
  return { pitch, tokens: [...extra, ...Object.values(cast)], drawings: [], frames }
}

type P = [string, number, number]

// Flecha roja discontinua: un jugador sale a presionar.
const press = (p: Pt[]): Drawing => ({ ...line('run', p), color: '#ff6b5e' })

const LINEUPS: Record<string, P[]> = {
  '4-3-3': [['1', 4, 34], ['2', 20, 58], ['4', 17, 42], ['5', 17, 26], ['3', 20, 10], ['6', 27, 34], ['8', 35, 46], ['10', 35, 22], ['7', 45, 58], ['9', 48, 34], ['11', 45, 10]],
  '4-4-2': [['1', 4, 34], ['2', 20, 58], ['4', 17, 42], ['5', 17, 26], ['3', 20, 10], ['7', 33, 58], ['6', 31, 40], ['8', 31, 28], ['11', 33, 10], ['9', 46, 40], ['10', 46, 28]],
  '4-2-3-1': [['1', 4, 34], ['2', 20, 58], ['4', 17, 42], ['5', 17, 26], ['3', 20, 10], ['6', 28, 40], ['8', 28, 28], ['7', 40, 58], ['10', 40, 34], ['11', 40, 10], ['9', 48, 34]],
  '3-5-2': [['1', 4, 34], ['4', 17, 46], ['5', 16, 34], ['3', 17, 22], ['2', 34, 60], ['6', 28, 34], ['8', 36, 44], ['10', 36, 24], ['11', 34, 8], ['9', 47, 40], ['7', 47, 28]],
}

const team = (sys: string, side: 'home' | 'away'): Token[] =>
  LINEUPS[sys].map(([n, x, y]) => (side === 'home' ? player('home', n, x, y) : player('away', n, 105 - x, 68 - y)))

const lineup = (home: string, away: string): Template => ({
  id: `sys-${home}-${away}`,
  group: 'Sistemas',
  name: `${home} contra ${away}`,
  build: () => ({ pitch: 'full', tokens: [...team(home, 'home'), ...team(away, 'away'), ballAt(52.5, 34)], drawings: [] }),
})

// Medio campo: x=0 es la línea central y x=52.5 la línea de fondo, portería en (52.5, 34).
const pts = (list: P[], t: 'home' | 'away') => list.map(([n, x, y]) => player(t, n, x, y))

// Barrera a 9,15 m del balón, en la línea balón-portería.
function wall(bx: number, by: number, n: number): P[] {
  const dx = 52.5 - bx, dy = 34 - by, d = Math.hypot(dx, dy)
  const ux = dx / d, uy = dy / d, cx = bx + ux * 9.15, cy = by + uy * 9.15
  return Array.from({ length: n }, (_, i) => {
    const o = (i - (n - 1) / 2) * 0.9 - 0.6
    return ['', cx - uy * o, cy + ux * o] as P
  })
}

const posesion: Template = {
  id: 'ej-posesion', group: 'Ejercicios', name: 'Posesión 4 contra 4 + 3 comodines',
  build: () => ({
    pitch: 'grid',
    tokens: [
      ...[[5, 0], [35, 0], [35, 30], [5, 30]].map(([x, y]) => coneAt(x, y)),
      ...pts([['', 12, 7], ['', 27, 8], ['', 13, 22], ['', 26, 22]], 'home'),
      ...pts([['', 16, 12], ['', 23, 12], ['', 17, 18], ['', 23, 18]], 'away'),
      player('neutral', 'C', 5, 15), player('neutral', 'C', 35, 15), player('neutral', 'C', 20, 15),
      ballAt(12.9, 7.8),
    ],
    drawings: [],
  }),
}


const rondoAnim: Template = {
  id: 'anim-rondo', group: 'Ejercicios', animated: true, name: 'Rondo 4 contra 2',
  build: () => {
    const o = (x: number, y: number): Pt => [x + 10, y + 5]
    const c = {
      a1: player('home', '1', ...o(10, 0)), a2: player('home', '2', ...o(20, 10)), a3: player('home', '3', ...o(10, 20)), a4: player('home', '4', ...o(0, 10)),
      d1: player('away', '', ...o(6, 9)), d2: player('away', '', ...o(11, 12)), b: ballAt(...o(0.9, 10.6)),
    }
    return animate('grid', c, [
      { note: 'Inicio: 4 atacantes en los lados del cuadrado y 2 defensores dentro. Un defensor salta a presionar al que tiene el balón.', draw: [line('pass', [o(0, 10), o(10, 0)])] },
      { note: 'Pase al de arriba. Los defensores se desplazan hacia el balón y el receptor ya está perfilado hacia la derecha.', move: { a1: o(11, 0), a2: o(20, 9), d1: o(8, 4), d2: o(12, 8), b: o(11, 0.9) }, draw: [line('pass', [o(11, 0), o(20, 9)])] },
      { note: 'Pase a la derecha. Un defensor presiona y el otro tapa el pase hacia abajo: se abre un hueco entre los dos.', move: { a2: o(20, 10), a3: o(9, 20), a4: o(0, 11), d1: o(14, 6), d2: o(12, 12), b: o(19.1, 10) }, draw: [line('pass', [o(20, 10), o(0, 11)])] },
      { note: 'El pase que rompe a los dos defensores: cruza entre ambos hasta el lado contrario. Es el pase que más vale en un rondo.', move: { a1: o(10, 0), a4: o(0, 10), d1: o(15, 8), d2: o(14, 14), b: o(0.9, 10) } },
      { note: 'Los defensores tienen que recorrer todo el cuadrado. Por eso se cansan y se cambian cada poco tiempo.', move: { a3: o(10, 20), d1: o(6, 9), d2: o(10, 13) } },
    ], [o(0, 0), o(20, 0), o(20, 20), o(0, 20)].map(([x, y]) => coneAt(x, y)))
  },
}

const cornerAnim: Template = {
  id: 'anim-corner', group: 'ABP', animated: true, name: 'Córner a favor: bloqueo y 3 carreras',
  build: () => {
    const c = {
      t: player('home', '10', 52, 0.6), blk: player('home', '4', 47.5, 31.5), r1: player('home', '5', 38, 28), r2: player('home', '9', 37, 36), r3: player('home', '2', 38, 44),
      reb: player('home', '6', 33, 34), e: player('home', '8', 35, 50), v1: player('home', '3', 20, 24), v2: player('home', '11', 20, 44),
      gk: player('away', '1', 51.8, 34), np: player('away', '', 51, 30), z1: player('away', '', 46, 28), z2: player('away', '', 46, 39),
      m1: player('away', '', 40.5, 29.8), m2: player('away', '', 39.5, 38.5), m3: player('away', '', 40.5, 46.5), f1: player('away', '', 40, 22), f2: player('away', '', 37.5, 53.5), f3: player('away', '', 24, 34),
      b: ballAt(51.2, 1.4),
    }
    return animate('half', c, [
      { note: 'Colocación: el 4 bloquea al portero, tres rematadores fuera del área, el 6 espera el rechace y dos se quedan vigilando la contra.', draw: [line('run', [[38, 28], [43, 27], [47, 26]]), line('run', [[37, 36], [42, 36.5], [46, 35]]), line('run', [[38, 44], [43, 43.5], [47.5, 42]])] },
      { note: 'Carreras cruzadas en el momento del saque: cada rematador ataca su zona (primer palo, centro y segundo palo) y suelta a su marcador.', move: { r1: [47, 26], r2: [45.5, 35], r3: [47.5, 42], m1: [44.5, 27.5], m2: [43, 36.5], m3: [44.5, 44], reb: [35, 33] }, draw: [line('pass', [[51.2, 1.4], [45.8, 34.2]])] },
      { note: 'Centro al punto de penalti largo y remate del 9, que llega sin marca porque su defensor se quedó atrás.', move: { b: [45.8, 34.2] }, draw: [line('pass', [[45.8, 34.2], [52.3, 32]])] },
      { note: 'Remate a portería. Si el portero despeja, el 6 está esperando el rechace en la frontal.', move: { b: [52.2, 32], gk: [52, 33] } },
    ])
  },
}

const lateralAnim: Template = {
  id: 'anim-lateral', group: 'ABP', animated: true, name: 'Falta lateral: carreras a la espalda',
  build: () => {
    const c = {
      t: player('home', '10', 37.5, 9), a: player('home', '4', 33, 24), m: player('home', '5', 33, 30), cc: player('home', '9', 33, 36), d: player('home', '2', 33, 42), e: player('home', '8', 28, 50),
      gk: player('away', '1', 51, 34), l1: player('away', '', 36, 27), l2: player('away', '', 36, 33), l3: player('away', '', 36, 39), l4: player('away', '', 36, 45), w: player('away', '', 41, 12),
      b: ballAt(38, 10),
    }
    return animate('half', c, [
      { note: 'La defensa rival forma una línea a la altura de la falta. Nuestros rematadores salen desde detrás de esa línea.', draw: [line('run', [[33, 24], [40, 26], [46, 27]]), line('run', [[33, 30], [40, 31], [45, 33]]), line('run', [[33, 36], [40, 37], [46, 39]])] },
      { note: 'Carreras a la espalda de la defensa en el momento del golpeo. Los defensores tienen que correr hacia su portería y llegan tarde.', move: { a: [46, 27], m: [45, 33], cc: [46, 39], l1: [41, 27.5], l2: [40.5, 33.5], l3: [41, 39.5], gk: [50, 33] }, draw: [line('pass', [[38, 10], [45, 32.2]])] },
      { note: 'El balón cae entre la línea defensiva y el portero, la zona más difícil de defender. Remata el 5.', move: { b: [45, 32.2] }, draw: [line('pass', [[45, 32.2], [52.3, 36]])] },
      { note: 'Remate a portería.', move: { b: [52.2, 36] } },
    ])
  },
}

const salidaAnim: Template = {
  id: 'anim-salida', group: 'Ejercicios', animated: true, name: 'Salida de balón 4 + portero contra 3',
  build: () => {
    const c = {
      gk: player('home', '1', 4, 34), c4: player('home', '4', 14, 22), c5: player('home', '5', 14, 46), l3: player('home', '3', 28, 6), l2: player('home', '2', 28, 62), p6: player('home', '6', 22, 34),
      r1: player('away', '', 25, 25), r2: player('away', '', 25, 43), r3: player('away', '', 31, 34),
      b: ballAt(4.9, 35),
    }
    return animate('full', c, [
      { note: 'El portero tiene el balón. Los centrales se abren a los lados del área y los laterales se colocan altos para dar amplitud.', draw: [line('pass', [[4.9, 35], [13.2, 45.5]])] },
      { note: 'Pase al central. Un delantero rival salta a presionarle y deja libre la zona del lateral.', move: { b: [13.2, 45.5], r2: [18, 45], r3: [24, 38], r1: [24, 28] }, draw: [line('pass', [[14, 46], [28, 61]])] },
      { note: 'El central atrae al rival y suelta el balón al lateral, que recibe libre por fuera.', move: { b: [28.6, 61], l2: [29, 61.5], r2: [22, 52] }, draw: [line('dribble', [[29, 61.5], [36, 60], [43, 57]])] },
      { note: 'El lateral conduce hacia dentro y la primera línea de presión rival queda superada. El pivote se ofrece para el siguiente pase.', move: { l2: [43, 57], b: [43.8, 56.2], p6: [32, 42], r2: [28, 53], r3: [30, 44] } },
    ])
  },
}

const cornerContraAnim: Template = {
  id: 'anim-corner-contra', group: 'ABP', animated: true, name: 'Córner en contra: defensa mixta',
  build: () => {
    const c = {
      gk: player('home', '1', 51.8, 34), np: player('home', '2', 51, 29.5), z1: player('home', '4', 47, 27.5), z2: player('home', '5', 47, 31.5), z3: player('home', '6', 47, 36), z4: player('home', '3', 47, 40.5),
      m1: player('home', '8', 40, 30), m2: player('home', '10', 39.5, 38.5), m3: player('home', '7', 40, 46.5), out: player('home', '11', 38, 22), st: player('home', '9', 30, 34),
      t: player('away', '', 52, 0.6), a1: player('away', '', 37, 28), a2: player('away', '', 36, 37.5), a3: player('away', '', 37, 46), a4: player('away', '', 34, 51), a5: player('away', '', 32, 34), a6: player('away', '', 20, 28),
      b: ballAt(51.2, 1.4),
    }
    return animate('half', c, [
      { note: 'Defensa mixta: 4 en zona en la línea del área pequeña, 3 marcando a los mejores rematadores, uno en el primer palo y dos fuera para la contra.', draw: [line('run', [[37, 28], [42, 28.5], [46, 29]]), line('run', [[36, 37.5], [41, 36], [44.5, 35]]), line('run', [[37, 46], [42, 44.5], [46, 43]])] },
      { note: 'Los rivales atacan el área en el saque. Los marcadores van pegados a ellos y los zonales no se mueven de su sitio.', move: { a1: [46, 29], a2: [44.5, 35], a3: [46, 43], m1: [44.5, 28], m2: [43.5, 36.5], m3: [45, 44.5] }, draw: [line('pass', [[51.2, 1.4], [47, 33]])] },
      { note: 'El balón cae en la zona del 5, que ataca el balón de cabeza y despeja lejos y hacia fuera.', move: { b: [47, 33], z2: [47.4, 32.6] }, draw: [line('pass', [[47, 33], [36.5, 20.5]])] },
      { note: 'El 11, que esperaba fuera del área, recoge el despeje.', move: { b: [36.5, 20.5], out: [37, 21.5] }, draw: [line('dribble', [[37, 21.5], [26, 20], [15, 19]])] },
      { note: 'Contraataque: el 11 conduce y el 9 ya está arriba para recibir.', move: { out: [15, 19], b: [14.2, 19.5], st: [10, 30], a6: [17, 24] } },
    ])
  },
}

const faltaFrontalAnim: Template = {
  id: 'anim-falta-frontal', group: 'ABP', animated: true, name: 'Falta frontal con barrera y amago',
  build: () => {
    const w = wall(30, 31, 4)
    const c = {
      t10: player('home', '10', 28.8, 30.2), t7: player('home', '7', 29, 33.5), a9: player('home', '9', 38, 26), a4: player('home', '4', 37, 40),
      gk: player('away', '1', 52, 33.5), w1: player('away', '', w[0][1], w[0][2]), w2: player('away', '', w[1][1], w[1][2]), w3: player('away', '', w[2][1], w[2][2]), w4: player('away', '', w[3][1], w[3][2]),
      d1: player('away', '', 41, 25), d2: player('away', '', 40, 41),
      b: ballAt(30, 31),
    }
    return animate('half', c, [
      { note: 'Falta a unos 23 m. Barrera de 4 a 9,15 m y portero colocado hacia el lado sin barrera. Dos lanzadores para que el portero no sepa quién tira.', draw: [line('run', [[29, 33.5], [31, 30], [33, 28]])] },
      { note: 'Amago: el 7 pasa por encima del balón sin tocarlo. El portero da un paso hacia el lado del 7.', move: { t7: [33, 28], gk: [52, 34.5] }, draw: [line('pass', [[30, 31], [52.2, 31]])] },
      { note: 'El 10 lanza por encima de la barrera al palo que tapaba el portero. El 9 y el 4 entran por si hay rechace.', move: { b: [52.2, 31], a9: [46, 28], a4: [46, 38], gk: [52, 33.2] } },
    ])
  },
}

const bandaAnim: Template = {
  id: 'anim-banda', group: 'ABP', animated: true, name: 'Saque de banda largo al área',
  build: () => {
    const c = {
      th: player('home', '3', 44, -0.8), p4: player('home', '4', 44, 20), p5: player('home', '5', 41, 30), p9: player('home', '9', 45, 36), p8: player('home', '8', 36, 40),
      gk: player('away', '1', 51.5, 33), d1: player('away', '', 46, 21.5), d2: player('away', '', 43, 31.5), d3: player('away', '', 46.5, 37.5), d4: player('away', '', 38, 41),
      b: ballAt(44, 0.4),
    }
    return animate('half', c, [
      { note: 'Saque de banda largo, como si fuera un córner. El 4 se coloca para peinar el balón en el primer palo.', draw: [line('run', [[41, 30], [44, 27], [47, 26]])] },
      { note: 'El 5 ataca el primer palo para despistar a su marcador; el saque busca la cabeza del 4.', move: { p5: [47, 26], d2: [45.5, 28] }, draw: [line('pass', [[44, 0.4], [45, 20.5]])] },
      { note: 'El 4 peina hacia atrás, al segundo palo.', move: { b: [45, 20.5] }, draw: [line('pass', [[45, 20.5], [48.5, 36]]), line('run', [[45, 36], [47, 36.5], [48.5, 36]])] },
      { note: 'El 9 llega al segundo palo y remata.', move: { b: [48.5, 36], p9: [48.5, 36.6], d3: [47.5, 39] }, draw: [line('pass', [[48.5, 36], [52.3, 33.5]])] },
      { note: 'Gol. El 8 se queda en la frontal por si hay rechace.', move: { b: [52.2, 33.5] } },
    ])
  },
}

const presionAnim: Template = {
  id: 'anim-presion', group: 'Ejercicios', animated: true, name: '6 contra 6: presión tras pérdida (5 segundos)',
  build: () => {
    const c = {
      h1: player('home', '1', 12, 8), h2: player('home', '2', 14, 22), h3: player('home', '3', 20, 15), h4: player('home', '4', 26, 7), h5: player('home', '5', 28, 24), h6: player('home', '6', 31, 15),
      a1: player('away', '', 5, 15), a2: player('away', '', 13, 13), a3: player('away', '', 16, 25), a4: player('away', '', 22.5, 18.5), a5: player('away', '', 29, 10), a6: player('away', '', 35, 21),
      b: ballAt(20.9, 15.3),
    }
    return animate('grid', c, [
      { note: 'Nuestro equipo ataca hacia la miniportería de la derecha. El 3 intenta un pase al 5.', draw: [line('pass', [[20.9, 15.3], [28, 24]])] },
      { note: 'El rival corta el pase: hemos perdido el balón. Empiezan los 5 segundos para recuperarlo.', move: { b: [23.3, 19.2] }, draw: [press([[20, 15], [22.4, 17.8]]), press([[28, 24], [23.6, 19.6]])] },
      { note: 'Los dos más cercanos (3 y 5) atacan al que tiene el balón. El 2 y el 6 tapan los pases cortos al rival.', move: { h3: [21.5, 17.2], h5: [24.6, 20.8], h2: [16, 22.5], h6: [31, 19], a4: [23, 19] } },
      { note: 'Recuperación antes de 5 segundos: punto. Ahora hay que atacar rápido, antes de que el rival se reorganice.', move: { b: [22.2, 18.4] }, draw: [line('pass', [[22.2, 18.4], [30.5, 18.6]])] },
      { note: 'Pase al 6, que conduce y marca en la miniportería. Un gol justo después de recuperar vale doble.', move: { b: [30.4, 18.5], a6: [34, 19.5] }, draw: [line('dribble', [[31, 19], [35, 17], [38.5, 15.2]])] },
      { note: 'Gol.', move: { h6: [37, 16.5], b: [39.4, 15] } },
    ], [item('minigoal', 0.6, 15, -90), item('minigoal', 39.4, 15, 90), ...[[0, 0], [40, 0], [40, 30], [0, 30]].map(([x, y]) => coneAt(x, y))])
  },
}

const tercerAnim: Template = {
  id: 'anim-tercer', group: 'Ejercicios', animated: true, name: 'Tercer hombre para superar la presión',
  build: () => {
    const c = {
      a: player('home', 'A', 6, 22), bb: player('home', 'B', 18, 9), cc: player('home', 'C', 9, 27),
      r1: player('away', '', 12, 17), r2: player('away', '', 18.5, 12.5),
      b: ballAt(6.9, 21.5),
    }
    return animate('grid', c, [
      { note: 'A quiere avanzar, pero un rival tapa el pase hacia delante. B se ofrece de espaldas y C prepara su carrera.', draw: [line('pass', [[6.9, 21.5], [17.3, 9.6]]), line('run', [[9, 27], [12, 23], [14.5, 20]])] },
      { note: 'Pase a B, que recibe de espaldas con un rival encima: no puede girarse.', move: { b: [17.3, 9.6], r2: [18.3, 10.8], cc: [14.5, 20] }, draw: [line('pass', [[17.3, 9.6], [14.9, 19.2]])] },
      { note: 'B la deja de primeras a C, el tercer hombre, que llega de cara y con todo el campo de frente.', move: { b: [14.9, 19.2], r1: [13, 18] }, draw: [line('dribble', [[14.5, 20], [22, 18], [31, 15]])] },
      { note: 'C conduce y cruza la puerta de conos: presión superada con dos toques.', move: { cc: [31, 15], b: [31.9, 15], r2: [21, 13] } },
    ], [coneAt(34, 12.5), coneAt(34, 17.5), ...[[0, 0], [40, 0], [40, 30], [0, 30]].map(([x, y]) => coneAt(x, y))])
  },
}

const contraAnim: Template = {
  id: 'anim-contra', group: 'Ejercicios', animated: true, name: 'Contraataque 3 contra 2',
  build: () => {
    const c = {
      h1: player('home', '10', 6, 34), h2: player('home', '11', 6, 14), h3: player('home', '7', 6, 54),
      d1: player('away', '', 30, 28), d2: player('away', '', 30, 40), gk: player('away', '1', 51.8, 34),
      b: ballAt(6.9, 34.5),
    }
    return animate('half', c, [
      { note: 'Acabamos de robar. El 10 conduce rápido por el centro y los extremos corren por fuera.', draw: [line('dribble', [[6, 34], [16, 34], [26, 34]]), line('run', [[6, 14], [22, 15], [34, 16]]), line('run', [[6, 54], [22, 53], [34, 52]])] },
      { note: 'El 10 conduce hacia los dos defensores para obligarles a decidir. Si salen a por él, quedan libres los de banda.', move: { h1: [26, 34], b: [26.9, 34.5], h2: [34, 16], h3: [34, 52], d1: [33, 30], d2: [33, 38] }, draw: [line('pass', [[26.9, 34.5], [39.5, 18.5]])] },
      { note: 'Pase al 11, libre por fuera. El 10 sigue su carrera hacia el área.', move: { b: [39.5, 18.5], h2: [40, 18], d1: [38, 25], h1: [36, 32], h3: [41, 47] }, draw: [line('pass', [[40, 18], [46.5, 33]]), line('run', [[36, 32], [42, 33], [46.5, 33.5]])] },
      { note: 'Pase atrás al 10, que llega de frente y sin marca.', move: { b: [46.5, 33], h1: [46.8, 33.7], d2: [44, 38], d1: [42, 27] }, draw: [line('pass', [[46.5, 33], [52.3, 31]])] },
      { note: 'Remate y gol. La clave es atacar antes de que llegue la ayuda defensiva.', move: { b: [52.2, 31] } },
    ])
  },
}

const centroAnim: Template = {
  id: 'anim-centro', group: 'Ejercicios', animated: true, name: 'Ataque por banda: lateral por fuera y centro',
  build: () => {
    const c = {
      w: player('home', '11', 30, 7), fb: player('home', '3', 22, 9), st: player('home', '9', 36, 30), ten: player('home', '10', 34, 41), mid: player('home', '8', 28, 34),
      gk: player('away', '1', 51.8, 34),
      b: ballAt(30.8, 7.6),
    }
    return animate('half', c, [
      { note: 'El extremo recibe abierto. Los maniquíes hacen de defensores. El lateral prepara la carrera por fuera (doblaje).', draw: [line('dribble', [[30, 7], [33, 9], [35, 11]]), line('run', [[22, 9], [32, 4], [41, 3]])] },
      { note: 'El extremo conduce hacia dentro y arrastra a su marcador. El lateral pasa por fuera a toda velocidad.', move: { w: [35, 11], b: [35.8, 11.5], fb: [41, 3] }, draw: [line('pass', [[35.8, 11.5], [42, 3.6]])] },
      { note: 'Pase al lateral, que llega cerca de la línea de fondo. Los rematadores atacan primer y segundo palo.', move: { b: [42, 3.6] }, draw: [line('dribble', [[41, 3], [45, 4], [48, 5]]), line('run', [[36, 30], [43, 30], [48, 30]]), line('run', [[34, 41], [41, 40.5], [47, 40]])] },
      { note: 'Centro al segundo palo.', move: { fb: [48, 5], b: [48.7, 5.6], st: [48, 30], ten: [47, 40], mid: [38, 35] }, draw: [line('pass', [[48.7, 5.6], [47, 39.3]])] },
      { note: 'El 10 remata. El 8 espera el rechace en la frontal.', move: { b: [47, 39.3], gk: [51.3, 36] }, draw: [line('pass', [[47, 39.3], [52.3, 32]])] },
      { note: 'Gol.', move: { b: [52.2, 32] } },
    ], [item('mannequin', 36, 9.5), item('mannequin', 45, 29), item('mannequin', 45, 36), item('mannequin', 45, 43)])
  },
}

const pressingAnim: Template = {
  id: 'anim-pressing', group: 'Ejercicios', animated: true, name: 'Presión alta al saque de portería rival',
  build: () => {
    const c = {
      gk: player('away', '1', 101, 34), c1: player('away', '', 91, 24), c2: player('away', '', 91, 44), l1: player('away', '', 82, 8), l2: player('away', '', 82, 60), pv: player('away', '', 84, 34),
      n9: player('home', '9', 80, 34), n7: player('home', '7', 76, 52), n11: player('home', '11', 76, 16), n10: player('home', '10', 72, 34), n8: player('home', '8', 68, 44), n6: player('home', '6', 66, 26),
      b: ballAt(100.1, 34.5),
    }
    return animate('full', c, [
      { note: 'Saque de portería del rival. Nuestros delanteros esperan para saltar a presionar cuando el portero pase.', draw: [line('pass', [[100.1, 34.5], [91.9, 43.5]])] },
      { note: 'Pase al central. El 9 salta en curva, tapando el pase de vuelta al portero. El 7 cierra el pase al lateral y el 10 marca al pivote.', move: { b: [91.9, 43.5], n9: [87, 39], n7: [84, 54], n10: [81, 35], n8: [74, 44], n11: [84, 22] }, draw: [press([[87, 39], [90.5, 42.5]])] },
      { note: 'El central queda encerrado contra la banda y sin pases seguros.', move: { n9: [89.5, 42], c2: [92.5, 46], b: [93.2, 45.6] }, draw: [line('pass', [[93.2, 45.6], [66, 50]])] },
      { note: 'Tiene que dar un pase largo sin ver bien, y nuestro 8 recupera el balón.', move: { b: [66, 50], n8: [66.5, 49], l2: [72, 56] } },
    ])
  },
}

const circuitoAnim: Template = {
  id: 'anim-circuito', group: 'Ejercicios', animated: true, name: 'Calentamiento: circuito con material y tiro',
  build: () => {
    const c = {
      p1: player('home', '1', 3, 8), p2: player('home', '2', 3, 21),
      b: ballAt(3.9, 21.5),
    }
    return animate('grid', c, [
      { note: 'Dos estaciones. Arriba, coordinación sin balón: escalera, vallas y aros. Abajo, conducción entre picas y tiro.', draw: [line('run', [[3, 8], [8, 8], [13, 8]])] },
      { note: 'Escalera: apoyos cortos y rápidos, dos pies en cada hueco. Abajo, el 2 conduce en zigzag entre las picas.', move: { p1: [13, 8], p2: [11, 23.5], b: [11.9, 23.8] } },
      { note: 'Vallas bajas: saltos a pies juntos, cayendo suave. El 2 sigue el zigzag.', move: { p1: [22, 8], p2: [17, 19], b: [17.9, 19.3] } },
      { note: 'Aros: apoyos alternos, un pie en cada aro. El 2 sale de las picas mirando a portería.', move: { p1: [31, 10], p2: [25, 21], b: [25.9, 20.8] }, draw: [line('pass', [[25.9, 20.8], [38.6, 15.3]])] },
      { note: 'Tiro a la miniportería. Después, cada uno vuelve trotando y cambian de estación.', move: { b: [38.6, 15.3], p1: [34, 12] } },
    ], [
      item('ladder', 8, 8), item('hurdle', 16, 8, 90), item('hurdle', 18.5, 8, 90), item('hurdle', 21, 8, 90),
      item('ring', 25, 10), item('ring', 27, 8), item('ring', 29, 10),
      item('pole', 7, 21), item('pole', 10, 23), item('pole', 13, 21), item('pole', 16, 23), item('pole', 19, 21),
      item('minigoal', 39.4, 15, 90), coneAt(1, 8), coneAt(1, 21),
    ])
  },
}

export const TEMPLATES: Template[] = [
  lineup('4-3-3', '4-4-2'), lineup('4-2-3-1', '4-3-3'), lineup('3-5-2', '4-2-3-1'), lineup('4-4-2', '4-4-2'),
  cornerAnim, cornerContraAnim, faltaFrontalAnim, lateralAnim, bandaAnim,
  circuitoAnim, rondoAnim, tercerAnim, salidaAnim, presionAnim, pressingAnim, contraAnim, centroAnim, posesion,
]

export const emptyBoard = (pitch: Board['pitch'] = 'full'): Board => ({ pitch, tokens: [], drawings: [] })
