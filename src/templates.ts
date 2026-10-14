import { type Board, type Token, type Pt, type Drawing, type Frame, player, ballAt, coneAt, line } from './model'

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

const cornerContra: Template = {
  id: 'abp-corner-contra', group: 'ABP', name: 'Córner en contra: defensa mixta',
  build: () => ({
    pitch: 'half',
    tokens: [
      ...pts([['1', 51.8, 34], ['2', 51, 29.5], ['4', 47, 27.5], ['5', 47, 31.5], ['6', 47, 36], ['3', 47, 40.5], ['8', 40, 30], ['10', 39.5, 38.5], ['7', 40, 46.5], ['11', 38, 22], ['9', 30, 34]], 'home'),
      ...pts([['', 52, 0.6], ['', 37, 28], ['', 36, 37.5], ['', 37, 46], ['', 34, 51], ['', 32, 34], ['', 20, 28]], 'away'),
      ballAt(51.2, 1.4),
    ],
    drawings: [
      { ...line('zone', [[46, 24.8], [52.5, 43.2]]), color: '#ffd23f' },
    ],
  }),
}

// Barrera a 9,15 m del balón, en la línea balón-portería.
function wall(bx: number, by: number, n: number): P[] {
  const dx = 52.5 - bx, dy = 34 - by, d = Math.hypot(dx, dy)
  const ux = dx / d, uy = dy / d, cx = bx + ux * 9.15, cy = by + uy * 9.15
  return Array.from({ length: n }, (_, i) => {
    const o = (i - (n - 1) / 2) * 0.9 - 0.6
    return ['', cx - uy * o, cy + ux * o] as P
  })
}

const faltaFrontal: Template = {
  id: 'abp-falta-frontal', group: 'ABP', name: 'Falta frontal con barrera de 4',
  build: () => ({
    pitch: 'half',
    tokens: [
      ...pts([['10', 29, 30.5], ['7', 30, 33], ['9', 38, 26], ['4', 37, 40]], 'home'),
      ...pts([['1', 52, 33], ...wall(30, 31, 4), ['', 41, 25], ['', 40, 41]], 'away'),
      ballAt(30, 31),
    ],
    drawings: [line('pass', [[30, 31], [52, 30.6]])],
  }),
}

const bandaLargo: Template = {
  id: 'abp-banda', group: 'ABP', name: 'Saque de banda largo al área',
  build: () => ({
    pitch: 'half',
    tokens: [
      ...pts([['3', 44, -0.8], ['4', 44, 20], ['5', 41, 30], ['9', 45, 36], ['8', 36, 40]], 'home'),
      ...pts([['1', 51.5, 33], ['', 46, 21], ['', 43, 31], ['', 46.5, 37], ['', 38, 41]], 'away'),
      ballAt(44, 0.4),
    ],
    drawings: [line('pass', [[44, 0.4], [47, 25]]), line('run', [[41, 30], [44, 27], [47, 26]])],
  }),
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

export const TEMPLATES: Template[] = [
  lineup('4-3-3', '4-4-2'), lineup('4-2-3-1', '4-3-3'), lineup('3-5-2', '4-2-3-1'), lineup('4-4-2', '4-4-2'),
  cornerAnim, cornerContra, faltaFrontal, lateralAnim, bandaLargo,
  rondoAnim, salidaAnim, posesion,
]

export const emptyBoard = (pitch: Board['pitch'] = 'full'): Board => ({ pitch, tokens: [], drawings: [] })
