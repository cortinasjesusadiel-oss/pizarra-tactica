import { COLORS, type Drawing, type Pt, type Token } from './model'

export function Markers() {
  return (
    <defs>
      {COLORS.map((c) => (
        <marker key={c} id={`ah-${c.slice(1)}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={c} />
        </marker>
      ))}
    </defs>
  )
}

// Curva suave que pasa por los puntos medios de cada tramo.
function smooth(p: Pt[]): string {
  if (p.length < 3) return `M${p.map((q) => q.join(' ')).join(' L')}`
  let d = `M${p[0][0]} ${p[0][1]}`
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2
    d += ` Q${p[i][0]} ${p[i][1]} ${mx} ${my}`
  }
  const l = p[p.length - 1]
  return d + ` L${l[0]} ${l[1]}`
}

// Línea ondulada a lo largo del trazo, la convención para conducción.
function wavy(p: Pt[], amp = 0.55, wave = 2.2): string {
  const out: Pt[] = []
  let dist = 0
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i]
    const seg = Math.hypot(x1 - x0, y1 - y0)
    if (!seg) continue
    const nx = -(y1 - y0) / seg, ny = (x1 - x0) / seg
    for (let s = 0; s < seg; s += 0.35) {
      const k = s / seg, a = Math.sin(((dist + s) / wave) * Math.PI * 2) * amp
      out.push([x0 + (x1 - x0) * k + nx * a, y0 + (y1 - y0) * k + ny * a])
    }
    dist += seg
  }
  out.push(p[p.length - 1])
  return smooth(out)
}

export function DrawingShape({ d, faded }: { d: Drawing; faded?: boolean }) {
  const common = { 'data-draw': d.id, opacity: faded ? 0.6 : 1 }
  const marker = `url(#ah-${d.color.slice(1)})`
  const sw = d.width
  const p = d.points
  if (p.length < 2) return null
  const a = p[0], b = p[p.length - 1]
  switch (d.type) {
    case 'pass':
      return <line {...common} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={d.color} strokeWidth={sw} strokeLinecap="round" markerEnd={marker} />
    case 'run':
      return <path {...common} d={smooth(p)} fill="none" stroke={d.color} strokeWidth={sw} strokeDasharray={`${sw * 2.6} ${sw * 2}`} strokeLinecap="round" markerEnd={marker} />
    case 'dribble':
      return <path {...common} d={wavy(p)} fill="none" stroke={d.color} strokeWidth={sw * 0.85} strokeLinejoin="round" markerEnd={marker} />
    case 'free':
      return <path {...common} d={smooth(p)} fill="none" stroke={d.color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    case 'zone': {
      const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1])
      return <rect {...common} x={x} y={y} width={Math.abs(b[0] - a[0])} height={Math.abs(b[1] - a[1])} fill={d.color} fillOpacity={0.18} stroke={d.color} strokeWidth={0.25} strokeDasharray="1 0.7" rx={0.4} />
    }
  }
}

const FILL = { home: 'var(--home)', away: 'var(--away)', neutral: 'var(--neutral)' }

export function TokenShape({ t, r, selected, upright }: { t: Token; r: number; selected: boolean; upright: boolean }) {
  const rot = upright ? 'rotate(-90)' : undefined
  if (t.kind === 'ball')
    return (
      <g data-token={t.id} transform={`translate(${t.x} ${t.y})`} className="token">
        <circle r={r * 1.4} fill="transparent" />
        <circle r={r * 0.45} fill="#fff" stroke="#111" strokeWidth={r * 0.1} />
        {selected && <circle r={r * 0.85} fill="none" stroke="#fff" strokeWidth={0.2} strokeDasharray="0.6 0.4" />}
      </g>
    )
  if (t.kind !== 'player')
    return (
      <g data-token={t.id} transform={`translate(${t.x} ${t.y}) rotate(${t.rot ?? 0})`} className="token">
        <circle r={r * 1.3} fill="transparent" />
        <Equipment kind={t.kind} r={r} />
        {selected && <circle r={r * 1.1} fill="none" stroke="#fff" strokeWidth={0.2} strokeDasharray="0.6 0.4" />}
      </g>
    )
  return (
    <g data-token={t.id} transform={`translate(${t.x} ${t.y})`} className="token">
      <circle r={r * 1.5} fill="transparent" />
      {selected && <circle r={r * 1.35} fill="none" stroke="#fff" strokeWidth={0.25} />}
      <circle r={r} fill={FILL[t.team]} stroke="rgba(0,0,0,.5)" strokeWidth={r * 0.12} />
      {t.label && (
        <text transform={rot} textAnchor="middle" dominantBaseline="central" fontSize={r * (t.label.length > 2 ? 0.8 : 1.05)} fontWeight={800} fill={t.team === 'away' ? '#08223a' : '#17201a'} fontFamily="system-ui, sans-serif">
          {t.label}
        </text>
      )}
    </g>
  )
}

// Material visto desde arriba. Tamaños aproximados en metros, algo agrandados en campos grandes para que se vean.
export function Equipment({ kind, r }: { kind: Token['kind']; r: number }) {
  const k = Math.max(1, r / 1.1)
  const dark = 'rgba(0,0,0,.45)'
  switch (kind) {
    case 'cone':
      return <path d={`M0 ${-r * 0.6} L${r * 0.5} ${r * 0.4} L${-r * 0.5} ${r * 0.4} z`} fill="#ff9f1c" stroke={dark} strokeWidth={0.08} />
    case 'pole':
      return <g><circle r={0.35 * k} fill="#ffd23f" stroke={dark} strokeWidth={0.1} /><path d={`M0 0 L${0.9 * k} ${-0.5 * k} L0 ${-0.9 * k} z`} fill="#ff6b5e" /></g>
    case 'flag':
      return <g><circle r={0.2 * k} fill="#fff" /><path d={`M0 0 L0 ${-1.2 * k} L${0.9 * k} ${-0.9 * k} L0 ${-0.6 * k}`} fill="#ff6b5e" stroke="#fff" strokeWidth={0.08} /></g>
    case 'hurdle':
      return <g><rect x={-0.6 * k} y={-0.12 * k} width={1.2 * k} height={0.24 * k} rx={0.08} fill="#ff9f1c" stroke={dark} strokeWidth={0.06} /><rect x={-0.7 * k} y={-0.25 * k} width={0.18 * k} height={0.5 * k} fill="#fff" /><rect x={0.52 * k} y={-0.25 * k} width={0.18 * k} height={0.5 * k} fill="#fff" /></g>
    case 'ring':
      return <circle r={0.4 * k} fill="none" stroke="#5bb6ff" strokeWidth={0.14 * k} />
    case 'ladder':
      return (
        <g fill="none" stroke="#ffd23f" strokeWidth={0.1 * k}>
          <rect x={-2 * k} y={-0.25 * k} width={4 * k} height={0.5 * k} />
          {[-1.5, -1, -0.5, 0, 0.5, 1, 1.5].map((x) => <line key={x} x1={x * k} y1={-0.25 * k} x2={x * k} y2={0.25 * k} />)}
        </g>
      )
    case 'mannequin':
      return <g><ellipse rx={0.55 * k} ry={0.32 * k} fill="#7c8a99" stroke={dark} strokeWidth={0.08} /><circle r={0.22 * k} fill="#c7d0da" /></g>
    case 'minigoal':
      return <path d={`M${-1 * k} ${0.5 * k} L${-1 * k} ${-0.5 * k} L${1 * k} ${-0.5 * k} L${1 * k} ${0.5 * k}`} fill="rgba(255,255,255,.25)" stroke="#fff" strokeWidth={0.18 * k} strokeLinejoin="round" />
    case 'goal':
      return <path d="M-3.66 1 L-3.66 -1 L3.66 -1 L3.66 1" fill="rgba(255,255,255,.25)" stroke="#fff" strokeWidth={0.3} strokeLinejoin="round" />
    default:
      return null
  }
}
