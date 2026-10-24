import { memo } from 'react'
import { PITCH, type GrassKind, type PitchKind } from '../nucleo/model'
import { useGrass } from './material'
const GRASS_TILE_M = 6
import { LOGO, LOGO_RATIO } from './brandLogo'
import type { LineKind, Mark } from '../nucleo/identity'
import { t } from '../i18n'

const CHALK = 'rgba(255,255,255,.92)'
const L = { fill: 'none', stroke: CHALK, strokeWidth: 0.22 }

// Un extremo de campo (área, área pequeña, punto de penalti, semicírculo y portería con red).
// `x` es la línea de fondo y `dir` hacia dónde mira el campo (+1 a la derecha, -1 a la izquierda).
function End({ x, dir, real }: { x: number; dir: 1 | -1; real?: boolean }) {
  const ax = dir > 0 ? x : x - 16.5
  const gx = dir > 0 ? x : x - 5.5
  const spot = x + dir * 11
  const arcX = x + dir * 16.5
  const netX = dir > 0 ? x - 2 : x
  return (
    <g>
      <rect x={ax} y={13.84} width={16.5} height={40.32} {...L} />
      <rect x={gx} y={24.84} width={5.5} height={18.32} {...L} />
      <circle cx={spot} cy={34} r={0.25} fill={CHALK} />
      <path d={`M${arcX} ${34 - 7.31} A9.15 9.15 0 0 ${dir > 0 ? 1 : 0} ${arcX} ${34 + 7.31}`} {...L} />
      {real ? <RealGoal x={x} dir={dir} /> : <rect x={netX} y={30.34} width={2} height={7.32} fill="url(#net)" stroke={CHALK} strokeWidth={0.18} />}
    </g>
  )
}

// Portería vista desde arriba: postes y larguero blancos con volumen, red de malla fina que cae hacia atrás
// (más oscura al fondo, donde está más baja) y la sombra que la red y el marco dejan en el césped.
function RealGoal({ x, dir }: { x: number; dir: 1 | -1 }) {
  const y0 = 30.34, y1 = 37.66, d = 2.2
  const bx = x - dir * d
  // Contorno de la red: algo más estrecha al fondo, porque los soportes de atrás van hacia dentro.
  const net = `M${x} ${y0} L${bx} ${y0 + 0.25} L${bx} ${y1 - 0.25} L${x} ${y1} Z`
  return (
    <g>
      <path d={net} transform={`translate(${-dir * 0.45} 0.6)`} fill="#000" opacity={0.2} />
      <path d={net} fill="rgba(255,255,255,.06)" />
      <path d={net} fill="url(#goal-mesh)" />
      <path d={net} fill={`url(#goal-depth-${dir > 0 ? 'l' : 'r'})`} />
      <path d={`M${x} ${y0} L${bx} ${y0 + 0.25} L${bx} ${y1 - 0.25} L${x} ${y1}`} fill="none" stroke="#d9dde0" strokeWidth={0.09} strokeLinejoin="round" />
      <rect x={x - 0.15} y={y0 - 0.15} width={0.3} height={y1 - y0 + 0.3} rx={0.15} fill="url(#goal-bar)" stroke="rgba(0,0,0,.25)" strokeWidth={0.03} />
      {[y0, y1].map((y) => <circle key={y} cx={x} cy={y} r={0.23} fill="url(#goal-post)" stroke="rgba(0,0,0,.3)" strokeWidth={0.03} />)}
    </g>
  )
}

// Césped realista: color, franjas de corte, textura de briznas que se repite sin costuras y luz.
// dia = estadio de día con la sombra de la grada; cuadros = corte en damero con focos; noche = oscuro y mate.
const GRASS: Record<Exclude<GrassKind, 'clasico'>, { base: string; a: string; b: string; out: string; tex: number }> = {
  dia: { base: '#418f3d', a: '#4c9b46', b: '#3d8739', out: '#326f31', tex: 0.4 },
  cuadros: { base: '#2f7c38', a: '#378641', b: '#2b7334', out: '#245e2b', tex: 0.38 },
  noche: { base: '#1f4a31', a: '#244f35', b: '#1c452d', out: '#163a26', tex: 0.3 },
}
function RealGrass({ style, kind, w, h, tile }: { style: Exclude<GrassKind, 'clasico'>; kind: PitchKind; w: number; h: number; tile: string | null }) {
  const g = GRASS[style]
  const sw = kind === 'grid' ? 5 : 105 / 18
  const n = Math.ceil((w + 6) / sw)
  const rows = kind === 'grid' ? 6 : 10
  const goals = kind === 'full' ? [5, w - 5] : kind === 'half' ? [w - 5] : []
  return (
    <g>
      <defs>
        {tile && (
          <pattern id="grass-tex" width={GRASS_TILE_M} height={GRASS_TILE_M} patternUnits="userSpaceOnUse">
            <image href={tile} width={GRASS_TILE_M} height={GRASS_TILE_M} />
          </pattern>
        )}
        <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity={0.26} />
          <stop offset="78%" stopColor="#000" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#000" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="wear">
          <stop offset="0%" stopColor="#a8935a" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#a8935a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="flood">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.09} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <clipPath id="grass-clip"><rect x={-5} y={-5} width={w + 10} height={h + 10} /></clipPath>
        <radialGradient id="vig" cx="50%" cy="50%" r="72%">
          <stop offset="55%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={style === 'noche' ? 0.5 : 0.25} />
        </radialGradient>
      </defs>
      <rect x={-5} y={-5} width={w + 10} height={h + 10} fill={g.out} />
      <rect x={-3} y={-3} width={w + 6} height={h + 6} fill={g.base} />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={-3 + i * sw} y={-3} width={Math.min(sw, w + 3 - (-3 + i * sw))} height={h + 6} fill={i % 2 ? g.b : g.a} />
      ))}
      {style === 'cuadros' && Array.from({ length: rows }, (_, i) =>
        <rect key={`r${i}`} x={-3} y={-3 + (i * (h + 6)) / rows} width={w + 6} height={(h + 6) / rows} fill={i % 2 ? '#000' : '#fff'} opacity={i % 2 ? 0.06 : 0.05} />)}
      {tile && <rect x={-5} y={-5} width={w + 10} height={h + 10} fill="url(#grass-tex)" opacity={g.tex} />}
      {style !== 'noche' && goals.map((x) => <ellipse key={x} cx={x} cy={h / 2} rx={6.5} ry={5} fill="url(#wear)" />)}
      {style === 'dia' && kind === 'full' && <ellipse cx={w / 2} cy={h / 2} rx={8} ry={6} fill="url(#wear)" opacity={0.6} />}
      {style === 'dia' && <rect x={-5} y={-5} width={w + 10} height={h * 0.2 + 5} fill="url(#roof)" />}
      {style === 'cuadros' && (
        <g clipPath="url(#grass-clip)">
          {[[0, 0], [w, 0], [0, h], [w, h]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={w * 0.45} fill="url(#flood)" />)}
        </g>
      )}
      <rect x={-5} y={-5} width={w + 10} height={h + 10} fill="url(#vig)" />
    </g>
  )
}

// Zonas de juego de posición: 5 carriles (marcados por las líneas de las áreas) y franjas a lo largo.
function Zones({ kind, w, h }: { kind: PitchKind; w: number; h: number }) {
  const lanes = kind === 'grid' ? [6, 12, 18, 24] : [13.84, 24.84, 43.16, 54.16]
  const cols = kind === 'full' ? [16.5, 35, 52.5, 70, 88.5] : kind === 'half' ? [17.5, 36] : [10, 20, 30]
  const z = { stroke: 'rgba(255,255,255,.45)', strokeWidth: 0.15, strokeDasharray: '0.8 0.6' }
  const names = [t('zona|Banda'), t('zona|Interior'), t('zona|Central'), t('zona|Interior'), t('zona|Banda')]
  const yb = [0, ...lanes, h]
  return (
    <g>
      {lanes.map((y) => <line key={`l${y}`} x1={0} y1={y} x2={w} y2={y} {...z} />)}
      {cols.map((x) => <line key={`c${x}`} x1={x} y1={0} x2={x} y2={h} {...z} />)}
      {/* El nombre va arriba de cada carril para que no lo tape el portero ni las fichas del centro. */}
      {kind !== 'grid' && names.map((n, i) => (
        <text key={i} x={1.2} y={yb[i] + 1.5} fontSize={1.6} fill="rgba(255,255,255,.55)" dominantBaseline="central" fontFamily="system-ui, sans-serif" fontWeight={700}>{n.toUpperCase()}</text>
      ))}
    </g>
  )
}

// Césped con corte profesional: franjas a lo largo, franjas suaves a lo ancho (efecto damero) y viñeta de luz.
// Marca de agua pequeña y transparente en el margen inferior derecho, fuera de las líneas del campo:
// `brand` = 'logo' para el logo del autor, otro texto para escribirlo, o nada para no poner marca.
// `ident` = la identidad del entrenador (escudo, equipo, nombre, eslogan), en el mismo sitio.
export const Pitch = memo(function Pitch({ kind, zones, brand, ident, grass = 'clasico' }: { kind: PitchKind; zones?: boolean; brand?: string; ident?: Mark | null; grass?: GrassKind }) {
  const { w, h } = PITCH[kind]
  const real = grass !== 'clasico'
  const tile = useGrass(real)
  const stripeW = kind === 'grid' ? 5 : 105 / 18
  const stripes = Math.ceil(w / stripeW)
  const bands = kind === 'grid' ? 6 : 8
  return (
    <g pointerEvents="none">
      <defs>
        <radialGradient id="light" cx="50%" cy="45%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.07} />
          <stop offset="70%" stopColor="#000" stopOpacity={0} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.22} />
        </radialGradient>
        <pattern id="net" width={0.5} height={0.5} patternUnits="userSpaceOnUse">
          <rect width={0.5} height={0.5} fill="rgba(255,255,255,.12)" />
          <path d="M0 0 L0.5 0.5 M0.5 0 L0 0.5" stroke="rgba(255,255,255,.5)" strokeWidth={0.05} />
        </pattern>
        <pattern id="goal-mesh" width={0.16} height={0.16} patternUnits="userSpaceOnUse">
          <path d="M0 0 H0.16 M0 0 V0.16" stroke="rgba(255,255,255,.62)" strokeWidth={0.026} />
        </pattern>
        {(['l', 'r'] as const).map((sd) => (
          <linearGradient key={sd} id={`goal-depth-${sd}`} x1={sd === 'l' ? 1 : 0} y1="0" x2={sd === 'l' ? 0 : 1} y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity={0} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.28} />
          </linearGradient>
        ))}
        <linearGradient id="goal-bar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#eef0f2" />
          <stop offset="100%" stopColor="#b8bec4" />
        </linearGradient>
        <radialGradient id="goal-post" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b5bbc1" />
        </radialGradient>
      </defs>
      {real ? <RealGrass style={grass} kind={kind} w={w} h={h} tile={tile} /> : (
        <>
        <rect x={-5} y={-5} width={w + 10} height={h + 10} fill="var(--pitch-out)" />
        <rect x={-3} y={-3} width={w + 6} height={h + 6} fill="var(--pitch)" />
        {Array.from({ length: stripes }, (_, i) =>
          i % 2 ? null : <rect key={i} x={i * stripeW} y={-3} width={Math.min(stripeW, w - i * stripeW)} height={h + 6} fill="var(--pitch-2)" />,
        )}
        {Array.from({ length: bands }, (_, i) =>
          i % 2 ? null : <rect key={`b${i}`} x={-3} y={(i * h) / bands} width={w + 6} height={h / bands} fill="#fff" opacity={0.035} />,
        )}
        <rect x={-5} y={-5} width={w + 10} height={h + 10} fill="url(#light)" />
        </>
      )}
      {zones && <Zones kind={kind} w={w} h={h} />}
      {brand === 'logo' && (
        <image href={LOGO} x={w - 2.3 * LOGO_RATIO} y={h + 0.3} width={2.3 * LOGO_RATIO} height={2.3} opacity={0.5} preserveAspectRatio="xMaxYMid meet" />
      )}
      {brand && brand !== 'logo' && (
        <text x={w} y={h + 2.05} textAnchor="end" fontSize={1.2} fontWeight={800} letterSpacing={0.12} fill="#fff" opacity={0.3} fontFamily="system-ui, sans-serif">{brand}</text>
      )}
      {ident && <IdentityMark m={ident} right={w} top={h + 0.25} h={2.5} maxW={w * 0.6} />}
      <rect x={0} y={0} width={w} height={h} {...L} />
      {kind === 'full' && (
        <>
          <line x1={52.5} y1={0} x2={52.5} y2={68} {...L} />
          <circle cx={52.5} cy={34} r={9.15} {...L} />
          <circle cx={52.5} cy={34} r={0.25} fill={CHALK} />
          <End x={0} dir={1} real={real} />
          <End x={105} dir={-1} real={real} />
          {[[0, 0, 0], [105, 0, 90], [105, 68, 180], [0, 68, 270]].map(([x, y, r]) => (
            <path key={`${x}${y}`} d="M1 0 A1 1 0 0 1 0 1" transform={`translate(${x} ${y}) rotate(${r})`} {...L} />
          ))}
        </>
      )}
      {kind === 'half' && (
        <>
          <path d={`M0 ${34 - 9.15} A9.15 9.15 0 0 1 0 ${34 + 9.15}`} {...L} />
          <End x={52.5} dir={-1} real={real} />
          <path d="M51.5 0 A1 1 0 0 0 52.5 1" {...L} />
          <path d="M52.5 67 A1 1 0 0 0 51.5 68" {...L} />
        </>
      )}
    </g>
  )
})

const WEIGHT: Record<LineKind, number> = { club: 800, coach: 700, slogan: 600 }
const SIZES = [[0.36], [0.32, 0.25], [0.27, 0.21, 0.2]]

// La identidad del entrenador en el margen de abajo a la derecha, fuera del campo: el escudo y, a su izquierda,
// el texto. Si el texto es muy largo se hace más pequeño y, si aun así no cabe, se corta con «…».
export function IdentityMark({ m, right, top, h, maxW }: { m: Mark; right: number; top: number; h: number; maxW: number }) {
  const cw = m.crest ? Math.min(h * m.crestRatio, h * 2) : 0
  const x = m.crest ? right - cw - h * 0.25 : right
  const room = maxW - (right - x)
  const sizes = SIZES[Math.min(m.lines.length, 3) - 1] ?? []
  // Ancho aproximado de Montserrat en negrita: 0,62 veces la altura de la letra por carácter.
  const lines = m.lines.slice(0, 3).map((l, i) => {
    let size = sizes[i] * h
    let text = l.text
    const est = (t: string, s: number) => t.length * s * 0.62
    if (est(text, size) > room) size = Math.max(size * 0.6, room / (text.length * 0.62))
    if (est(text, size) > room) text = text.slice(0, Math.max(1, Math.floor(room / (size * 0.62)) - 1)).trimEnd() + '…'
    return { ...l, size, text }
  })
  const total = lines.reduce((a, l) => a + l.size * 1.22, 0)
  let y = top + h / 2 - total / 2
  return (
    <g opacity={0.6} pointerEvents="none">
      {m.crest && <image href={m.crest} x={right - cw} y={top + (h - cw / m.crestRatio) / 2} width={cw} height={cw / m.crestRatio} preserveAspectRatio="xMidYMid meet" />}
      {lines.map((l, i) => {
        y += l.size * 1.22
        return (
          <text key={i} x={x} y={y - l.size * 0.3} textAnchor="end" fontSize={l.size} fontWeight={WEIGHT[l.kind]} fill="#fff" opacity={i === 0 ? 1 : 0.85} fontFamily="Montserrat, system-ui, sans-serif">{l.text}</text>
        )
      })}
    </g>
  )
}
