import { memo } from 'react'
import { PITCH, type PitchKind } from './model'

const CHALK = 'rgba(255,255,255,.92)'
const L = { fill: 'none', stroke: CHALK, strokeWidth: 0.22 }

// Un extremo de campo (área, área pequeña, punto de penalti, semicírculo y portería con red).
// `x` es la línea de fondo y `dir` hacia dónde mira el campo (+1 a la derecha, -1 a la izquierda).
function End({ x, dir }: { x: number; dir: 1 | -1 }) {
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
      <rect x={netX} y={30.34} width={2} height={7.32} fill="url(#net)" stroke={CHALK} strokeWidth={0.18} />
    </g>
  )
}

// Zonas de juego de posición: 5 carriles (marcados por las líneas de las áreas) y franjas a lo largo.
function Zones({ kind, w, h }: { kind: PitchKind; w: number; h: number }) {
  const lanes = kind === 'grid' ? [6, 12, 18, 24] : [13.84, 24.84, 43.16, 54.16]
  const cols = kind === 'full' ? [16.5, 35, 52.5, 70, 88.5] : kind === 'half' ? [17.5, 36] : [10, 20, 30]
  const z = { stroke: 'rgba(255,255,255,.45)', strokeWidth: 0.15, strokeDasharray: '0.8 0.6' }
  const names = ['Banda', 'Interior', 'Central', 'Interior', 'Banda']
  const yb = [0, ...lanes, h]
  return (
    <g>
      {lanes.map((y) => <line key={`l${y}`} x1={0} y1={y} x2={w} y2={y} {...z} />)}
      {cols.map((x) => <line key={`c${x}`} x1={x} y1={0} x2={x} y2={h} {...z} />)}
      {kind !== 'grid' && names.map((n, i) => (
        <text key={i} x={1.2} y={(yb[i] + yb[i + 1]) / 2} fontSize={1.6} fill="rgba(255,255,255,.55)" dominantBaseline="central" fontFamily="system-ui, sans-serif" fontWeight={700}>{n.toUpperCase()}</text>
      ))}
    </g>
  )
}

// Césped con corte profesional: franjas a lo largo, franjas suaves a lo ancho (efecto damero) y viñeta de luz.
// `brand`: marca de agua pequeña y transparente en el margen inferior, fuera de las líneas del campo.
export const Pitch = memo(function Pitch({ kind, zones, brand }: { kind: PitchKind; zones?: boolean; brand?: string }) {
  const { w, h } = PITCH[kind]
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
      </defs>
      <rect x={-5} y={-5} width={w + 10} height={h + 10} fill="var(--pitch-out)" />
      <rect x={-3} y={-3} width={w + 6} height={h + 6} fill="var(--pitch)" />
      {Array.from({ length: stripes }, (_, i) =>
        i % 2 ? null : <rect key={i} x={i * stripeW} y={-3} width={Math.min(stripeW, w - i * stripeW)} height={h + 6} fill="var(--pitch-2)" />,
      )}
      {Array.from({ length: bands }, (_, i) =>
        i % 2 ? null : <rect key={`b${i}`} x={-3} y={(i * h) / bands} width={w + 6} height={h / bands} fill="#fff" opacity={0.035} />,
      )}
      <rect x={-5} y={-5} width={w + 10} height={h + 10} fill="url(#light)" />
      {zones && <Zones kind={kind} w={w} h={h} />}
      {brand && (
        <text x={w} y={h + 2.05} textAnchor="end" fontSize={1.2} fontWeight={800} letterSpacing={0.12} fill="#fff" opacity={0.3} fontFamily="system-ui, sans-serif">{brand}</text>
      )}
      <rect x={0} y={0} width={w} height={h} {...L} />
      {kind === 'full' && (
        <>
          <line x1={52.5} y1={0} x2={52.5} y2={68} {...L} />
          <circle cx={52.5} cy={34} r={9.15} {...L} />
          <circle cx={52.5} cy={34} r={0.25} fill={CHALK} />
          <End x={0} dir={1} />
          <End x={105} dir={-1} />
          {[[0, 0, 0], [105, 0, 90], [105, 68, 180], [0, 68, 270]].map(([x, y, r]) => (
            <path key={`${x}${y}`} d="M1 0 A1 1 0 0 1 0 1" transform={`translate(${x} ${y}) rotate(${r})`} {...L} />
          ))}
        </>
      )}
      {kind === 'half' && (
        <>
          <path d={`M0 ${34 - 9.15} A9.15 9.15 0 0 1 0 ${34 + 9.15}`} {...L} />
          <End x={52.5} dir={-1} />
          <path d="M51.5 0 A1 1 0 0 0 52.5 1" {...L} />
          <path d="M52.5 67 A1 1 0 0 0 51.5 68" {...L} />
        </>
      )}
    </g>
  )
})
