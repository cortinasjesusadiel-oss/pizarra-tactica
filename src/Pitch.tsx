import { PITCH, type PitchKind } from './model'

const L = { fill: 'none', stroke: 'rgba(255,255,255,.85)', strokeWidth: 0.3 }

// Un extremo de campo (área, área pequeña, punto de penalti, semicírculo y portería).
// `x` es la línea de fondo y `dir` hacia dónde mira el campo (+1 a la derecha, -1 a la izquierda).
function End({ x, dir }: { x: number; dir: 1 | -1 }) {
  const ax = dir > 0 ? x : x - 16.5
  const gx = dir > 0 ? x : x - 5.5
  const spot = x + dir * 11
  const arcX = x + dir * 16.5
  return (
    <g>
      <rect x={ax} y={13.84} width={16.5} height={40.32} {...L} />
      <rect x={gx} y={24.84} width={5.5} height={18.32} {...L} />
      <circle cx={spot} cy={34} r={0.3} fill="rgba(255,255,255,.85)" />
      <path d={`M${arcX} ${34 - 7.31} A9.15 9.15 0 0 ${dir > 0 ? 1 : 0} ${arcX} ${34 + 7.31}`} {...L} />
      <rect x={dir > 0 ? x - 1.8 : x} y={30.34} width={1.8} height={7.32} {...L} strokeWidth={0.25} />
    </g>
  )
}

export function Pitch({ kind }: { kind: PitchKind }) {
  const { w, h } = PITCH[kind]
  const stripes = Math.round(w / (kind === 'grid' ? 5 : 5.25))
  return (
    <g pointerEvents="none">
      <rect x={-4} y={-4} width={w + 8} height={h + 8} fill="var(--pitch)" />
      {Array.from({ length: stripes }, (_, i) =>
        i % 2 ? null : <rect key={i} x={(i * w) / stripes} y={0} width={w / stripes} height={h} fill="var(--pitch-2)" />,
      )}
      <rect x={0} y={0} width={w} height={h} {...L} />
      {kind === 'full' && (
        <>
          <line x1={52.5} y1={0} x2={52.5} y2={68} {...L} />
          <circle cx={52.5} cy={34} r={9.15} {...L} />
          <circle cx={52.5} cy={34} r={0.3} fill="rgba(255,255,255,.85)" />
          <End x={0} dir={1} />
          <End x={105} dir={-1} />
        </>
      )}
      {kind === 'half' && (
        <>
          <path d={`M0 ${34 - 9.15} A9.15 9.15 0 0 1 0 ${34 + 9.15}`} {...L} />
          <End x={52.5} dir={-1} />
        </>
      )}
    </g>
  )
}
