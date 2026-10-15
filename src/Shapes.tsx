import { useId } from 'react'
import { COLORS, DEFAULT_LOOK, lobAt, lobControl, type Drawing, type Look, type Pt, type Token } from './model'

export function Markers() {
  return (
    <defs>
      <radialGradient id="tok-shine" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
        <stop offset="45%" stopColor="#fff" stopOpacity={0.08} />
        <stop offset="100%" stopColor="#000" stopOpacity={0.18} />
      </radialGradient>
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

// `part` muestra solo un tramo del trazo, de 0 (inicio) a 1 (final): en la animación las flechas se van
// borrando por detrás mientras ocurre el movimiento y las siguientes se dibujan desde su inicio.
export function DrawingShape({ d, faded, part, upright }: { d: Drawing; faded?: boolean; part?: [number, number]; upright?: boolean }) {
  const mid = useId().replace(/:/g, '')
  const p = d.points
  if (d.type === 'text') return <TextLabel d={d} opacity={(faded ? 0.6 : 1) * (part ? part[1] - part[0] : 1)} upright={upright} />
  if (p.length < 2) return null
  const [from, to] = part ?? [0, 1]
  if (to - from < 0.001) return null
  const trimmed = from > 0.001 || to < 0.999
  const area = d.type === 'zone' || d.type === 'focus'
  const opacity = (faded ? 0.6 : 1) * (area && trimmed ? to - from : 1)
  const common = { 'data-draw': d.id, opacity }
  const marker = `url(#ah-${d.color.slice(1)})`
  const sw = d.width
  const a = p[0], b = p[p.length - 1]
  const path = d.type === 'lob' ? lobPath(a, b) : d.type === 'pass' || d.type === 'shot' || d.type === 'line' ? `M${a[0]} ${a[1]} L${b[0]} ${b[1]}` : d.type === 'dribble' ? wavy(p) : smooth(p)
  // Máscara que deja ver solo el tramo pedido (pathLength=1 hace que las medidas vayan de 0 a 1).
  const mask = trimmed && !area ? `m${mid}` : undefined
  const defs = mask && (
    <defs>
      <mask id={mask} maskUnits="userSpaceOnUse" x={-200} y={-200} width={600} height={600}>
        <path d={path} pathLength={1} fill="none" stroke="#fff" strokeWidth={sw * 4 + 1.2} strokeLinecap="butt" strokeDasharray={`${to - from} 3`} strokeDashoffset={-from} />
        {to > 0.999 && <circle cx={b[0]} cy={b[1]} r={sw * 3 + 0.8} fill="#fff" />}
      </mask>
    </defs>
  )
  const m = mask ? { mask: `url(#${mask})` } : {}
  switch (d.type) {
    case 'pass':
      return <>{defs}<line {...common} {...m} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={d.color} strokeWidth={sw} strokeLinecap="round" markerEnd={marker} /></>
    case 'run':
      return <>{defs}<path {...common} {...m} d={path} fill="none" stroke={d.color} strokeWidth={sw} strokeDasharray={`${sw * 2.6} ${sw * 2}`} strokeLinecap="round" markerEnd={marker} /></>
    case 'lob': {
      // Pase aéreo: parábola gruesa por el aire y, debajo, su sombra recta por el suelo.
      const arr = lobArrow(a, b, sw)
      return (
        <g {...common}>
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#000" strokeOpacity={0.35 * (to - from)} strokeWidth={sw * 1.1} strokeLinecap="round" />
          {defs}
          <g {...m}>
            <polygon points={arr.body} fill={d.color} />
            <polygon points={arr.head} fill={d.color} />
          </g>
        </g>
      )
    }
    case 'arrow':
      // Flecha continua que sigue el trazo: movimiento sin balón o cualquier indicación.
      return <>{defs}<path {...common} {...m} d={path} fill="none" stroke={d.color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" markerEnd={marker} /></>
    case 'line':
      return <>{defs}<line {...common} {...m} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={d.color} strokeWidth={sw} strokeLinecap="round" /></>
    case 'press': {
      // Presión: trazo continuo que acaba en una barra, el jugador sale a tapar o a encimar.
      const q = p[p.length - 2], L = Math.hypot(b[0] - q[0], b[1] - q[1]) || 1
      const nx = -(b[1] - q[1]) / L, ny = (b[0] - q[0]) / L, h = sw * 3.2
      return <g {...common} {...m}>{defs}<path d={path} fill="none" stroke={d.color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><line x1={b[0] + nx * h} y1={b[1] + ny * h} x2={b[0] - nx * h} y2={b[1] - ny * h} stroke={d.color} strokeWidth={sw * 1.3} strokeLinecap="round" /></g>
    }
    case 'shot': {
      // Tiro: doble línea con punta, la convención de las pizarras.
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L, o = sw * 0.9
      const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, e = sw * 2.2
      return (
        <g {...common} {...m}>{defs}
          <line x1={a[0] + nx * o} y1={a[1] + ny * o} x2={b[0] + nx * o - ux * e} y2={b[1] + ny * o - uy * e} stroke={d.color} strokeWidth={sw * 0.7} strokeLinecap="round" />
          <line x1={a[0] - nx * o} y1={a[1] - ny * o} x2={b[0] - nx * o - ux * e} y2={b[1] - ny * o - uy * e} stroke={d.color} strokeWidth={sw * 0.7} strokeLinecap="round" />
          <polygon points={`${b[0]},${b[1]} ${b[0] - ux * e * 1.6 + nx * o * 2.4},${b[1] - uy * e * 1.6 + ny * o * 2.4} ${b[0] - ux * e * 1.6 - nx * o * 2.4},${b[1] - uy * e * 1.6 - ny * o * 2.4}`} fill={d.color} />
        </g>
      )
    }
    case 'dribble':
      return <>{defs}<path {...common} {...m} d={path} fill="none" stroke={d.color} strokeWidth={sw * 0.85} strokeLinejoin="round" markerEnd={marker} /></>
    case 'free':
      return <>{defs}<path {...common} {...m} d={path} fill="none" stroke={d.color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></>
    case 'zone': {
      const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1])
      return <rect {...common} x={x} y={y} width={Math.abs(b[0] - a[0])} height={Math.abs(b[1] - a[1])} fill={d.color} fillOpacity={0.18} stroke={d.color} strokeWidth={0.25} strokeDasharray="1 0.7" rx={0.4} />
    }
    case 'focus': {
      // Foco: un círculo de luz suave para señalar a un jugador o una zona clave. Se dibuja del centro hacia fuera.
      const r = Math.max(1.2, Math.hypot(b[0] - a[0], b[1] - a[1]))
      const gid = `f${mid}`
      return (
        <g {...common}>
          <defs>
            <radialGradient id={gid}>
              <stop offset="0%" stopColor={d.color} stopOpacity={0.05} />
              <stop offset="70%" stopColor={d.color} stopOpacity={0.16} />
              <stop offset="100%" stopColor={d.color} stopOpacity={0.32} />
            </radialGradient>
          </defs>
          <circle cx={a[0]} cy={a[1]} r={r} fill={`url(#${gid})`} />
          <circle cx={a[0]} cy={a[1]} r={r} fill="none" stroke={d.color} strokeWidth={0.3} strokeOpacity={0.9} />
          <circle cx={a[0]} cy={a[1]} r={r + 0.6} fill="none" stroke={d.color} strokeWidth={0.15} strokeOpacity={0.35} />
        </g>
      )
    }
  }
}

// Curva del pase aéreo: una parábola alta (ver lobControl).
function lobPath(a: Pt, b: Pt): string {
  const c = lobControl(a, b)
  return `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`
}

// Flecha gruesa del pase aéreo: el trazo se ensancha hacia el final y acaba en una punta grande.
function lobArrow(a: Pt, b: Pt, sw: number): { body: string; head: string } {
  const N = 48, head = sw * 6
  // La punta se queda un poco antes de la llegada para que no la tape la ficha que recibe.
  let uTip = 1
  while (uTip > 0.6 && Math.hypot(lobAt(a, b, uTip)[0] - b[0], lobAt(a, b, uTip)[1] - b[1]) < 2.2) uTip -= 0.005
  const e = lobAt(a, b, uTip)
  let uEnd = uTip
  while (uEnd > 0.4 && Math.hypot(lobAt(a, b, uEnd)[0] - e[0], lobAt(a, b, uEnd)[1] - e[1]) < head) uEnd -= 0.005
  const left: Pt[] = [], right: Pt[] = []
  for (let k = 0; k <= N; k++) {
    const u = (k / N) * uEnd, p = lobAt(a, b, u), q = lobAt(a, b, Math.min(1, u + 0.01))
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1
    const nx = -(q[1] - p[1]) / len, ny = (q[0] - p[0]) / len, w = sw * (0.45 + 1.05 * (u / uEnd))
    left.push([p[0] + nx * w, p[1] + ny * w]); right.push([p[0] - nx * w, p[1] - ny * w])
  }
  const s = lobAt(a, b, uEnd)
  const len = Math.hypot(e[0] - s[0], e[1] - s[1]) || 1
  const nx = -(e[1] - s[1]) / len, ny = (e[0] - s[0]) / len, hw = sw * 3.4
  const f = (p: Pt) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`
  return {
    body: [...left, ...right.reverse()].map(f).join(' '),
    head: [f([s[0] + nx * hw, s[1] + ny * hw]), f(e), f([s[0] - nx * hw, s[1] - ny * hw])].join(' '),
  }
}

// Letrero: el texto sobre una etiqueta oscura para que se lea encima del césped. Varias líneas con saltos de línea.
function TextLabel({ d, opacity, upright }: { d: Drawing; opacity: number; upright?: boolean }) {
  const lines = (d.text ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
  if (!lines.length || opacity < 0.01) return null
  const fs = 2.1, lh = fs * 1.25
  const w = Math.max(...lines.map((l) => l.length)) * fs * 0.56 + fs * 1.2
  const h = lines.length * lh + fs * 0.7
  const [x, y] = d.points[0]
  return (
    <g data-draw={d.id} opacity={opacity} transform={`translate(${x} ${y})${upright ? ' rotate(-90)' : ''}`} className="label">
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={0.8} fill="#0b1510" fillOpacity={0.78} stroke={d.color} strokeWidth={0.18} />
      {lines.map((l, i) => (
        <text key={i} x={0} y={-h / 2 + fs * 0.35 + lh * (i + 0.5)} textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight={700} fill={d.color} fontFamily="Montserrat, system-ui, sans-serif">{l}</text>
      ))}
    </g>
  )
}

// Texto oscuro sobre colores claros y blanco sobre colores oscuros.
function inkFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return l > 0.6 ? '#17201a' : '#ffffff'
}

// Camiseta vista de frente, centrada en (0,0), de unas 2,1 unidades de ancho.
const SHIRT = 'M-0.42,-0.95 L-1,-0.66 L-1.08,-0.12 L-0.7,-0.02 L-0.7,0.98 L0.7,0.98 L0.7,-0.02 L1.08,-0.12 L1,-0.66 L0.42,-0.95 Q0,-0.62 -0.42,-0.95 Z'

export function TokenShape({ t, r, selected, upright, look = DEFAULT_LOOK }: { t: Token; r: number; selected: boolean; upright: boolean; look?: Look }) {
  const rot = upright ? 'rotate(-90)' : undefined
  if (t.kind === 'ball')
    return (
      <g data-token={t.id} transform={`translate(${t.x} ${t.y})`} className="token">
        <circle r={r * 0.7} fill="transparent" />
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
  const fill = t.team === 'home' ? look.home : t.team === 'away' ? look.away : '#f4f4f4'
  const ink = inkFor(fill)
  const num = look.text !== 'name' ? t.label : ''
  const name = look.text !== 'number' ? t.name?.trim() : ''
  const fs = r * (num.length > 2 ? 0.8 : 1.05)
  return (
    <g data-token={t.id} transform={`translate(${t.x} ${t.y})`} className="token">
      <circle r={r * 1.5} fill="transparent" />
      {selected && <circle r={r * 1.45} fill="none" stroke="#fff" strokeWidth={0.25} />}
      <g transform={rot}>
        {look.shape === 'disc' && <circle r={r} fill={fill} stroke="rgba(0,0,0,.5)" strokeWidth={r * 0.12} />}
        {look.shape === 'pro' && (
          <>
            <ellipse cx={r * 0.12} cy={r * 0.22} rx={r * 1.05} ry={r * 1.0} fill="rgba(0,0,0,.35)" />
            <circle r={r} fill={fill} stroke="#fff" strokeWidth={r * 0.16} />
            <circle r={r * 0.92} fill="url(#tok-shine)" />
          </>
        )}
        {look.shape === 'shirt' && (
          <>
            <path d={SHIRT} transform={`translate(${r * 0.1} ${r * 0.14}) scale(${r * 1.05})`} fill="rgba(0,0,0,.35)" />
            <path d={SHIRT} transform={`scale(${r * 1.05})`} fill={fill} stroke="rgba(0,0,0,.55)" strokeWidth={0.07} strokeLinejoin="round" />
            <path d="M-0.42,-0.95 Q0,-0.62 0.42,-0.95" transform={`scale(${r * 1.05})`} fill="none" stroke={ink} strokeOpacity={0.5} strokeWidth={0.08} />
          </>
        )}
        {num && (
          <text y={look.shape === 'shirt' ? r * 0.18 : 0} textAnchor="middle" dominantBaseline="central" fontSize={look.shape === 'shirt' ? fs * 0.95 : fs} fontWeight={800} fill={ink} fontFamily="system-ui, sans-serif">
            {num}
          </text>
        )}
        {name && (
          <text y={r * (look.shape === 'shirt' ? 1.95 : 1.85)} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.62} fontWeight={700} fill="#fff" stroke="rgba(0,0,0,.75)" strokeWidth={r * 0.16} paintOrder="stroke" strokeLinejoin="round" fontFamily="system-ui, sans-serif">
            {name}
          </text>
        )}
      </g>
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
