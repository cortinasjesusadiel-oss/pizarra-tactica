// Dibujo del balón: una esfera de verdad vista desde arriba, con sus paneles curvados por la perspectiva.
// Los trazados se calculan una vez para una esfera de radio 1 y se escalan al tamaño del balón.

type V = [number, number, number]
const norm = (v: V): V => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l] }
const mix = (a: V, b: V, k: number): V => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]

// Giro fijo para que el balón no se vea "de frente" y parezca más natural.
function orient(v: V): V {
  const ax = 0.42, az = 0.3
  const [x, y, z] = v
  const y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax)
  return [x * Math.cos(az) - y1 * Math.sin(az), x * Math.sin(az) + y1 * Math.cos(az), z1]
}

// Polígono esférico proyectado: cada lado se divide en tramos y se lleva a la superficie de la esfera.
// Lo que queda detrás se aplasta contra el borde, que luego se recorta con un círculo.
function spherePath(poly: V[], seg = 6): string | null {
  const pts: [number, number][] = []
  let front = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length]
    for (let k = 0; k < seg; k++) {
      const p = orient(norm(mix(a, b, k / seg)))
      if (p[2] > 0) front++
      const q = p[2] >= 0 ? [p[0], p[1]] : (() => { const l = Math.hypot(p[0], p[1]) || 1; return [p[0] / l, p[1] / l] })()
      pts.push([q[0], q[1]])
    }
  }
  if (!front) return null
  return 'M' + pts.map((p) => `${p[0].toFixed(3)} ${p[1].toFixed(3)}`).join('L') + 'Z'
}

// Icosaedro: sus 12 vértices dan los pentágonos y sus 20 caras los hexágonos del balón clásico.
const PHI = (1 + Math.sqrt(5)) / 2
const ICO: V[] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
]
const EDGE = Math.min(...ICO.slice(1).map((v) => Math.hypot(v[0] - ICO[0][0], v[1] - ICO[0][1], v[2] - ICO[0][2])))
const near = (a: V, b: V) => Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - EDGE) < 1e-6
const third = (a: V, b: V) => mix(a, b, 1 / 3)

function pentagons(): V[][] {
  return ICO.map((a) => {
    const nb = ICO.filter((b) => b !== a && near(a, b))
    // Ordena los vecinos alrededor del vértice.
    const n = norm(a), u: V = [nb[0][0] - a[0], nb[0][1] - a[1], nb[0][2] - a[2]]
    const dn = u[0] * n[0] + u[1] * n[1] + u[2] * n[2]
    const e1 = norm([u[0] - n[0] * dn, u[1] - n[1] * dn, u[2] - n[2] * dn])
    const e2: V = [n[1] * e1[2] - n[2] * e1[1], n[2] * e1[0] - n[0] * e1[2], n[0] * e1[1] - n[1] * e1[0]]
    const ang = (b: V) => { const d: V = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; return Math.atan2(d[0] * e2[0] + d[1] * e2[1] + d[2] * e2[2], d[0] * e1[0] + d[1] * e1[1] + d[2] * e1[2]) }
    return nb.sort((p, q) => ang(p) - ang(q)).map((b) => third(a, b))
  })
}

function hexagons(): V[][] {
  const out: V[][] = []
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) {
    const a = ICO[i], b = ICO[j], c = ICO[k]
    if (near(a, b) && near(b, c) && near(a, c)) out.push([third(a, b), third(b, a), third(b, c), third(c, b), third(c, a), third(a, c)])
  }
  return out
}

// Cubo inflado: seis paneles grandes con costuras curvas, como los balones modernos.
function cubePanels(): V[][] {
  const f: V[][] = []
  for (const ax of [0, 1, 2]) for (const s of [-1, 1]) {
    const u = (ax + 1) % 3, w = (ax + 2) % 3
    const corner = (a: number, b: number): V => { const v: V = [0, 0, 0]; v[ax] = s; v[u] = a; v[w] = b; return v }
    f.push([corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)])
  }
  return f
}

// Parche interior de cada panel del cubo (más pequeño), para los adornos de color del balón moderno.
function cubeInner(k: number): V[][] {
  return cubePanels().map((q) => {
    const c = q.reduce((m, v) => [m[0] + v[0] / 4, m[1] + v[1] / 4, m[2] + v[2] / 4] as V, [0, 0, 0] as V)
    return q.map((v) => mix(c, v, k))
  })
}

const paths = (polys: V[][], seg?: number) => polys.map((p) => spherePath(p, seg)).filter((x): x is string => !!x)

export const BALL_PENTAGONS = paths(pentagons())
export const BALL_HEXAGONS = paths(hexagons())
export const BALL_PANELS = paths(cubePanels(), 14)
export const BALL_PATCHES = paths(cubeInner(0.5), 10)

export type BallStyle = 'clasico' | 'verde' | 'blanco'
