import type { Template } from '../anim'
import type { Sample } from '../clip'
import type { Board, Token } from '../model'
import { PRO } from '../pro'
import { t } from '../i18n'

// Jugadas grabadas de ejemplo (Pro): se mueven en tiempo real, todos a la vez, con defensa automática.
// Cada jugador tiene unos puntos de paso (segundo, x, y) y se mueve por una curva suave que pasa por ellos.

type Way = [number, number, number][]

function along(wp: Way, s: number): [number, number] {
  const n = wp.length
  if (s <= wp[0][0]) return [wp[0][1], wp[0][2]]
  if (s >= wp[n - 1][0]) return [wp[n - 1][1], wp[n - 1][2]]
  let i = 0
  while (wp[i + 1][0] < s) i++
  const p0 = wp[Math.max(0, i - 1)], p1 = wp[i], p2 = wp[i + 1], p3 = wp[Math.min(n - 1, i + 2)]
  const h = p2[0] - p1[0], u = (s - p1[0]) / h
  const tan = (a: Way[number], b: Way[number], k: 1 | 2) => ((b[k] - a[k]) / Math.max(1e-6, b[0] - a[0])) * h
  const u2 = u * u, u3 = u2 * u
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2
  const at = (k: 1 | 2) => h00 * p1[k] + h10 * tan(p0, p2, k) + h01 * p2[k] + h11 * tan(p1, p3, k)
  return [at(1), at(2)]
}

function recorded(pitch: Board['pitch'], dur: number, cast: [string, Token['team'], string, Way][], still: [string, Token['team'], string, number, number][],
  ball: [number, number], passes: { t: number; to: string }[]): Board {
  const tokens: Token[] = []
  const tracks: Record<string, Sample[]> = {}
  for (const [id, team, label, wp] of cast) {
    tokens.push({ id, kind: 'player', team, label, x: wp[0][1], y: wp[0][2] })
    const tr: Sample[] = []
    for (let i = 0; i <= dur * 60; i++) { const s = i / 60, [x, y] = along(wp, s); tr.push([+s.toFixed(3), +x.toFixed(3), +y.toFixed(3)]) }
    tracks[id] = tr
  }
  for (const [id, team, label, x, y] of still) tokens.push({ id, kind: 'player', team, label, x, y })
  tokens.push({ id: 'balon', kind: 'ball', team: 'neutral', label: '', x: ball[0], y: ball[1] })
  return { pitch, tokens, drawings: [], clip: { dur, tracks, passes, auto: true } }
}

// Rondo de posesión 4+1 contra 4 en 40×30: los de casa abren líneas de pase, el comodín (C) juega con quien tiene el
// balón y los cuatro rivales marcan y presionan solos.
const rondoGrabado: Template = {
  id: 'grab-rondo-4-1-4',
  group: 'Ejercicios',
  name: t('Rondo 4+1 contra 4 en tiempo real'),
  animated: true,
  build: () => recorded('grid', 16, [
    ['h1', 'home', '1', [[0, 8, 7], [0.8, 8.6, 7.4], [2.2, 9.5, 9], [4, 8, 10.5], [6, 7, 12], [8.4, 6.5, 13.5], [9.6, 6.8, 12], [11.2, 8.4, 11.5], [13, 9.5, 8.5], [16, 9, 7.5]]],
    ['h2', 'home', '2', [[0, 32, 7], [1.4, 31.5, 7.5], [3, 29.6, 10.2], [4.2, 30, 10.6], [6, 32.5, 9], [8, 33, 8], [11, 31.5, 7.6], [12.8, 30, 9.5], [14.6, 30.6, 10.4], [16, 32, 9.6]]],
    ['h3', 'home', '3', [[0, 32, 23], [2, 32.5, 22.5], [3.6, 33.5, 21], [5.1, 34, 19], [6, 33.4, 18.6], [7.6, 31, 20.5], [10, 30.5, 22.5], [13, 32.5, 21.5], [15.6, 33.5, 18.5], [16, 33.4, 18.4]]],
    ['h4', 'home', '4', [[0, 8, 23], [2, 7.5, 22.5], [4.5, 8.5, 21.5], [6.4, 10.5, 20.5], [7.6, 11.4, 19.6], [8.6, 10.6, 19.2], [9.4, 10.2, 19.6], [11, 8.5, 21.5], [14, 7.5, 22.5], [16, 8.5, 21.5]]],
    ['c', 'neutral', 'C', [[0, 20, 15], [0.8, 18, 13.4], [1.6, 17.3, 13], [2.4, 18, 13.5], [4, 21.5, 16.5], [5.4, 24, 18], [6.6, 24.2, 18.2], [7.6, 22.5, 17.5], [9.6, 18.5, 14], [11.2, 16.4, 12.2], [12, 16.5, 12.4], [12.8, 18, 13.6], [14.6, 21, 14], [16, 20, 15]]],
  ], [['r5', 'away', '5', 15, 11], ['r6', 'away', '6', 25, 11], ['r7', 'away', '7', 25, 19], ['r8', 'away', '8', 15, 19]],
  [9.2, 7.3], [
    { t: 0.7, to: 'c' }, { t: 2.3, to: 'h2' }, { t: 4.1, to: 'h3' }, { t: 5.9, to: 'c' }, { t: 7.5, to: 'h4' },
    { t: 9.3, to: 'h1' }, { t: 11, to: 'c' }, { t: 12.7, to: 'h2' }, { t: 14.5, to: 'h3' },
  ]),
}

export const GRABADAS: Template[] = PRO ? [rondoGrabado] : []
