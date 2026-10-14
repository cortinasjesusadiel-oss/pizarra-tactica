import { type Board, type Token, type Pt, player, ballAt, coneAt, line } from './model'

export interface Template {
  id: string
  group: 'Sistemas' | 'ABP' | 'Ejercicios'
  name: string
  build: () => Board
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

const cornerFavor: Template = {
  id: 'abp-corner-favor', group: 'ABP', name: 'Córner a favor: bloqueo y 3 carreras',
  build: () => ({
    pitch: 'half',
    tokens: [
      ...pts([['10', 52, 0.6], ['4', 47.5, 32], ['5', 38, 28], ['9', 37, 36], ['2', 38, 44], ['8', 35, 50], ['6', 33, 34], ['3', 20, 24], ['11', 20, 44]], 'home'),
      ...pts([['1', 51.8, 34], ['', 51, 30], ['', 46, 28], ['', 46, 38], ['', 40.5, 29.8], ['', 39.5, 38.5], ['', 40.5, 46.5], ['', 40, 22], ['', 37.5, 53.5], ['', 24, 34]], 'away'),
      ballAt(51.2, 1.4),
    ],
    drawings: [
      line('pass', [[51.2, 1.4], [46, 35]]),
      line('run', [[38, 28], [43, 27], [47, 26]]),
      line('run', [[37, 36], [42, 36.5], [46, 35]]),
      line('run', [[38, 44], [43, 43.5], [47.5, 42]]),
    ],
  }),
}

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

const faltaLateral: Template = {
  id: 'abp-falta-lateral', group: 'ABP', name: 'Falta lateral: carreras a la espalda',
  build: () => ({
    pitch: 'half',
    tokens: [
      ...pts([['10', 37.5, 9], ['4', 33, 24], ['5', 33, 30], ['9', 33, 36], ['2', 33, 42], ['8', 28, 50]], 'home'),
      ...pts([['1', 51, 34], ['', 36, 27], ['', 36, 33], ['', 36, 39], ['', 36, 45], ['', 41, 12]], 'away'),
      ballAt(38, 10),
    ],
    drawings: [
      line('pass', [[38, 10], [45, 33]]),
      line('run', [[33, 24], [40, 26], [46, 27]]),
      line('run', [[33, 30], [40, 31], [45, 33]]),
      line('run', [[33, 36], [40, 37], [46, 39]]),
    ],
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

const rondo: Template = {
  id: 'ej-rondo', group: 'Ejercicios', name: 'Rondo 4 contra 2',
  build: () => {
    const cx = 20, cy = 15
    const c: Pt[] = [[cx - 10, cy - 10], [cx + 10, cy - 10], [cx + 10, cy + 10], [cx - 10, cy + 10]]
    return {
      pitch: 'grid',
      tokens: [
        ...c.map(([x, y]) => coneAt(x, y)),
        player('home', '1', cx, cy - 10), player('home', '2', cx + 10, cy), player('home', '3', cx, cy + 10), player('home', '4', cx - 10, cy),
        player('away', '', cx - 3, cy - 1), player('away', '', cx + 2, cy + 2),
        ballAt(cx - 9.2, cy + 0.8),
      ],
      drawings: [line('pass', [[cx - 10, cy], [cx, cy - 10]]), line('pass', [[cx, cy - 10], [cx + 10, cy]])],
    }
  },
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

export const TEMPLATES: Template[] = [
  lineup('4-3-3', '4-4-2'), lineup('4-2-3-1', '4-3-3'), lineup('3-5-2', '4-2-3-1'), lineup('4-4-2', '4-4-2'),
  cornerFavor, cornerContra, faltaFrontal, faltaLateral, bandaLargo,
  rondo, posesion,
]

export const emptyBoard = (pitch: Board['pitch'] = 'full'): Board => ({ pitch, tokens: [], drawings: [] })
