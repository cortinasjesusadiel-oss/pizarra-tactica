import { t as tr } from './i18n'
import { PITCH, line, type Board, type Frame, type Pt, type Token } from './model'

// «Jugada grabada» (función Pro): en vez de pasos, las fichas se mueven en tiempo real tal y como las arrastras
// con el dedo, el ratón o el S Pen. Se graba por capas: primero unos jugadores, luego otros, mientras lo ya grabado
// se reproduce. El balón va pegado al pie del que lo lleva y viaja en los pases a velocidad real, al sitio donde
// llega el compañero (recibe en carrera). Con «Defensa automática» los rivales que no grabaste marcan a su jugador y
// el más cercano presiona al que tiene el balón.

// Muestra de una ficha grabada: [segundo, x, y].
export type Sample = [number, number, number]
// Pase: en el segundo `t` el balón sale hacia el jugador `to` (o hacia el punto `at` si no va a nadie).
export interface Pass { t: number; to: string | null; at?: Pt }
export interface Clip {
  dur: number
  tracks: Record<string, Sample[]>
  passes: Pass[]
  auto?: boolean
}

// Lo que se ve en un instante de la jugada grabada.
export interface ClipView { pos: Record<string, Pt>; face: Record<string, number>; holder: string | null; moving: Record<string, number> }

const HZ = 30
const SUB = 2
const DT = 1 / (HZ * SUB)

const len = (x: number, y: number) => Math.hypot(x, y)
const unit = (x: number, y: number): Pt => { const l = len(x, y); return l < 1e-6 ? [0, 0] : [x / l, y / l] }
const smooth = (x: number) => { const c = Math.max(0, Math.min(1, x)); return c * c * (3 - 2 * c) }
const angDiff = (a: number, b: number) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d }

// Posición grabada de una ficha en el segundo `t` (null si a esa hora aún no se había grabado).
export function trackAt(tr: Sample[] | undefined, t: number): Pt | null {
  if (!tr?.length || t < tr[0][0]) return null
  const last = tr[tr.length - 1]
  if (t >= last[0]) return [last[1], last[2]]
  let lo = 0, hi = tr.length - 1
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tr[m][0] <= t) lo = m; else hi = m }
  const a = tr[lo], b = tr[hi], u = (t - a[0]) / Math.max(1e-6, b[0] - a[0])
  return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
}

// Velocidad de pase en metros por segundo: algo más lenta en espacios reducidos, como en un rondo.
const passSpeed = (b: Board) => (b.pitch === 'grid' ? 11 : 15)
const isKeeper = (b: Board, t: Token) => b.pitch !== 'grid' && t.label === '1'

export interface SimOpts {
  // Fichas que se están arrastrando ahora mismo (al grabar): su posición manda.
  live?: () => Record<string, Pt>
}

// Simulación paso a paso. Se usa igual al grabar (en tiempo real) y al reproducir (de golpe, guardada en memoria),
// así lo que ves al grabar es lo mismo que sale después.
export class Sim {
  t = 0
  pos: Record<string, Pt> = {}
  vel: Record<string, Pt> = {}
  face: Record<string, number> = {}
  ball: Pt = [0, 0]
  holder: string | null = null
  flight: { t0: number; T: number; from: Pt; to: Pt; recv: string | null } | null = null
  got = 0
  presser: string | null = null
  marks: Record<string, string | null> = {}
  passIdx = 0
  private simulated = new Set<string>()
  readonly ballId: string | null
  readonly players: Token[]
  readonly auto: Set<string>
  private readonly r: number
  private readonly W: number
  private readonly H: number

  constructor(readonly b: Board, readonly clip: Clip, readonly opts: SimOpts = {}) {
    const { r, w, h } = PITCH[b.pitch]
    this.r = r; this.W = w; this.H = h
    this.players = b.tokens.filter((t) => t.kind === 'player')
    const ball = b.tokens.find((t) => t.kind === 'ball')
    this.ballId = ball?.id ?? null
    for (const t of b.tokens) { this.pos[t.id] = [t.x, t.y]; this.vel[t.id] = [0, 0]; this.face[t.id] = t.team === 'away' ? Math.PI : 0 }
    this.auto = new Set(clip.auto ? this.players.filter((t) => t.team === 'away').map((t) => t.id) : [])
    if (ball) {
      this.ball = [ball.x, ball.y]
      let best = r * 1.8
      for (const p of this.players) { const d = len(p.x - ball.x, p.y - ball.y); if (d < best) { best = d; this.holder = p.id } }
      this.got = -1
    }
    // Cada defensa automático marca al rival más cercano (sin repetir). El portero se queda en su portería.
    const att = this.players.filter((t) => t.team === 'home' && !isKeeper(b, t))
    const defs = this.players.filter((t) => this.auto.has(t.id) && !isKeeper(b, t))
    const pairs: [number, string, string][] = []
    for (const d of defs) for (const a of att) pairs.push([len(d.x - a.x, d.y - a.y), d.id, a.id])
    pairs.sort((x, y) => x[0] - y[0])
    const usedA = new Set<string>()
    for (const [, d, a] of pairs) if (!(d in this.marks) && !usedA.has(a)) { this.marks[d] = a; usedA.add(a) }
    for (const d of defs) if (!(d.id in this.marks)) this.marks[d.id] = null
    this.facing(0)
  }

  // Dónde está una ficha "con guion" (grabada o arrastrándose) en el segundo `t`; null si la mueve la simulación.
  private scripted(id: string, t: number): Pt | null {
    const lv = this.opts.live?.()[id]
    if (lv) return lv
    return trackAt(this.clip.tracks[id], t)
  }

  // Dónde estará un jugador dentro de `dt` segundos, para que el pase llegue a su carrera.
  private future(id: string, dt: number): Pt {
    const live = this.opts.live?.()[id]
    const p = this.pos[id]
    if (live || (!this.clip.tracks[id] && !this.auto.has(id))) {
      const v = this.vel[id], k = Math.min(dt, 1.2)
      return [p[0] + v[0] * k, p[1] + v[1] * k]
    }
    return trackAt(this.clip.tracks[id], this.t + dt) ?? [p[0] + this.vel[id][0] * Math.min(dt, 1.2), p[1] + this.vel[id][1] * Math.min(dt, 1.2)]
  }

  // Pase hecho ahora mismo (al grabar). Quita los pases que había grabados a partir de aquí.
  pass(to: string | null, at?: Pt) {
    this.clip.passes = this.clip.passes.filter((p) => p.t < this.t)
    const p: Pass = { t: +this.t.toFixed(3), to, ...(at ? { at } : {}) }
    this.clip.passes.push(p)
    this.passIdx = this.clip.passes.length - 1
  }

  private startPass(p: Pass) {
    const from: Pt = [...this.ball]
    let to: Pt = p.at ?? from
    let T = 0.3
    if (p.to && this.pos[p.to]) {
      to = this.pos[p.to]
      for (let k = 0; k < 4; k++) {
        T = Math.max(0.3, len(to[0] - from[0], to[1] - from[1]) / passSpeed(this.b))
        to = this.future(p.to, T)
      }
    } else T = Math.max(0.3, len(to[0] - from[0], to[1] - from[1]) / passSpeed(this.b))
    this.flight = { t0: this.t, T, from, to, recv: p.to }
    this.holder = null
  }

  // Un paso de simulación de 1/60 s.
  step() {
    const t = this.t + DT
    const prev = Object.fromEntries(Object.entries(this.pos).map(([k, v]) => [k, [...v] as Pt]))
    // 1. Jugadores grabados o arrastrados.
    for (const p of this.players) {
      const s = this.scripted(p.id, t)
      if (!s) continue
      const tr = this.clip.tracks[p.id]
      // Un defensa automático que empieza a grabarse se funde del sitio simulado al grabado, sin saltos.
      if (this.auto.has(p.id) && tr?.length && !this.opts.live?.()[p.id] && t - tr[0][0] < 0.4) {
        const k = smooth((t - tr[0][0]) / 0.4), q = this.pos[p.id]
        this.pos[p.id] = [q[0] + (s[0] - q[0]) * k, q[1] + (s[1] - q[1]) * k]
      } else this.pos[p.id] = s
    }
    // 2. Pases que tocan ahora.
    const passes = this.clip.passes
    while (this.passIdx < passes.length && passes[this.passIdx].t <= t) this.startPass(passes[this.passIdx++])
    // 3. Defensa automática.
    this.defend(t)
    // 4. Velocidad (suavizada) y hacia dónde mira cada uno.
    for (const p of this.players) {
      if (this.simulated.has(p.id)) continue
      const q = this.pos[p.id], o = prev[p.id]
      const vx = (q[0] - o[0]) / DT, vy = (q[1] - o[1]) / DT, v = this.vel[p.id], a = Math.min(1, DT / 0.12)
      this.vel[p.id] = [v[0] + (vx - v[0]) * a, v[1] + (vy - v[1]) * a]
    }
    this.t = t
    this.facing(DT)
    // 5. Balón.
    this.moveBall()
  }

  private defend(t: number) {
    this.simulated.clear()
    if (!this.auto.size) return
    const { W, H, b } = this
    const grid = b.pitch === 'grid'
    const goal: Pt = [W, H / 2]
    const f = this.flight
    const target: Pt = f ? f.to : this.ball
    const carrier = f ? f.recv : this.holder
    const carrierTeam = carrier ? this.players.find((p) => p.id === carrier)?.team : undefined
    const attacking = carrierTeam !== 'away'
    const free = this.players.filter((p) => this.auto.has(p.id) && !this.scripted(p.id, t) && !isKeeper(b, p))
    // Quién presiona: el más cercano al balón (o a donde va el pase). Solo cambia si otro está claramente más cerca.
    if (attacking && free.length) {
      const d = (id: string) => len(this.pos[id][0] - target[0], this.pos[id][1] - target[1])
      let best = free[0].id
      for (const p of free) if (d(p.id) < d(best)) best = p.id
      if (!this.presser || !free.some((p) => p.id === this.presser) || d(best) < d(this.presser) - 1.5) this.presser = best
    } else this.presser = null
    for (const p of this.players) {
      if (!this.auto.has(p.id) || this.scripted(p.id, t)) continue
      const q = this.pos[p.id]
      let aim: Pt, vmax = 6.2
      if (isKeeper(b, p)) {
        aim = [W - 2.2, H / 2 + (this.ball[1] - H / 2) * 0.18]; vmax = 4
      } else if (p.id === this.presser) {
        const toMe = unit(q[0] - target[0], q[1] - target[1]), toGoal = grid ? [0, 0] : unit(goal[0] - target[0], goal[1] - target[1])
        const dir = unit(toMe[0] + toGoal[0] * 0.7, toMe[1] + toGoal[1] * 0.7)
        // Se planta a un paso del que tiene el balón, sin montarse encima.
        const gap = this.r * 2.3
        aim = [target[0] + dir[0] * gap, target[1] + dir[1] * gap]; vmax = 7
      } else {
        const m = this.marks[p.id]
        if (m && attacking) {
          // Marca: entre su jugador y el balón (y su portería en campo grande), a un par de metros.
          const a = this.pos[m]
          const tb = unit(this.ball[0] - a[0], this.ball[1] - a[1]), tg = grid ? [0, 0] : unit(goal[0] - a[0], goal[1] - a[1])
          const dir = unit(tb[0] * 0.75 + tg[0] * 0.5, tb[1] * 0.75 + tg[1] * 0.5)
          // Cerca del balón marca encima; lejos, se separa de su jugador y se acerca al balón (cierra por dentro).
          const far = len(this.ball[0] - a[0], this.ball[1] - a[1])
          const dist = Math.min(Math.max(grid ? 2.6 : 3, this.r * 2.5) + far * (grid ? 0.22 : 0.18), far * 0.5 + this.r * 2.5)
          aim = [a[0] + dir[0] * dist, a[1] + dir[1] * dist]
        } else {
          // Sin marca: cierra por dentro, entre el balón y su portería (o el centro del espacio).
          const c: Pt = grid ? [W / 2, H / 2] : goal
          aim = [this.ball[0] + (c[0] - this.ball[0]) * 0.35, this.ball[1] + (c[1] - this.ball[1]) * 0.35]
        }
      }
      // Arranca y frena como una persona: velocidad limitada y aceleración limitada.
      const v = this.vel[p.id]
      let dx = (aim[0] - q[0]) * 2.4, dy = (aim[1] - q[1]) * 2.4
      const sp = len(dx, dy)
      if (sp > vmax) { dx *= vmax / sp; dy *= vmax / sp }
      let ax = (dx - v[0]) / DT, ay = (dy - v[1]) / DT
      const ac = len(ax, ay), amax = 9
      if (ac > amax) { ax *= amax / ac; ay *= amax / ac }
      const nv: Pt = [v[0] + ax * DT, v[1] + ay * DT]
      let nx = q[0] + nv[0] * DT, ny = q[1] + nv[1] * DT
      // Nadie se monta encima de otro: si se acerca demasiado, se aparta un poco.
      const room = this.r * 2.15
      for (const o of this.players) {
        if (o.id === p.id) continue
        const op = this.pos[o.id], ex = nx - op[0], ey = ny - op[1], d = len(ex, ey)
        if (d < room && d > 1e-6) { const push = Math.min(room - d, 4 * DT); nx += (ex / d) * push; ny += (ey / d) * push }
      }
      nv[0] = (nx - q[0]) / DT; nv[1] = (ny - q[1]) / DT
      this.pos[p.id] = [nx, ny]
      this.vel[p.id] = nv
      this.simulated.add(p.id)
    }
  }

  private facing(dt: number) {
    const passes = this.clip.passes
    const next = passes[this.passIdx]
    for (const p of this.players) {
      const q = this.pos[p.id], v = this.vel[p.id], sp = len(v[0], v[1])
      let want: Pt
      if (p.id === this.holder && next && next.t - this.t < 0.45 && next.t >= this.t) {
        // Antes de pasar, el cuerpo se orienta hacia el compañero.
        const z = next.to ? this.pos[next.to] : next.at ?? q
        want = unit(z[0] - q[0], z[1] - q[1])
      } else {
        const tb = p.id === this.holder ? [Math.cos(this.face[p.id]), Math.sin(this.face[p.id])] : unit(this.ball[0] - q[0], this.ball[1] - q[1])
        const mv = unit(v[0], v[1]), w = smooth((sp - 0.6) / 1.6)
        want = [mv[0] * w + tb[0] * (1 - w), mv[1] * w + tb[1] * (1 - w)]
      }
      if (len(want[0], want[1]) < 1e-3) continue
      const goal = Math.atan2(want[1], want[0])
      if (!dt) { this.face[p.id] = goal; continue }
      const d = angDiff(this.face[p.id], goal), maxTurn = 9 * dt
      this.face[p.id] += Math.max(-maxTurn, Math.min(maxTurn, d))
    }
  }

  private moveBall() {
    if (!this.ballId) return
    const f = this.flight
    if (f) {
      const u = Math.min(1, (this.t - f.t0) / f.T)
      // El balón sale fuerte y llega algo más lento, como un pase de verdad.
      const k = u * (1.25 - 0.25 * u)
      let x = f.from[0] + (f.to[0] - f.from[0]) * k, y = f.from[1] + (f.to[1] - f.from[1]) * k
      if (f.recv) {
        // Si el compañero no está justo donde se calculó, el balón le acaba llegando igual.
        const rp = this.pos[f.recv], c = u * u * u
        x += (rp[0] - f.to[0]) * c; y += (rp[1] - f.to[1]) * c
      }
      this.ball = [x, y]
      if (u >= 1) { this.flight = null; this.holder = f.recv; this.got = this.t }
    } else if (this.holder) {
      // Pegado al pie, delante del jugador hacia donde mira. Al recibir, el control lo coloca en 0,3 s.
      const q = this.pos[this.holder], a = this.face[this.holder]
      const sp = len(this.vel[this.holder][0], this.vel[this.holder][1])
      const k = this.got < 0 ? 1 : smooth((this.t - this.got) / 0.3)
      const off = this.r * (0.78 + 0.3 * Math.min(1, sp / 5)) * k
      const tx = q[0] + Math.cos(a) * off, ty = q[1] + Math.sin(a) * off
      this.ball = this.got >= 0 && this.t - this.got < 0.3 ? [this.ball[0] + (tx - this.ball[0]) * 0.35, this.ball[1] + (ty - this.ball[1]) * 0.35] : [tx, ty]
    }
    this.pos[this.ballId] = [...this.ball]
  }

  view(): ClipView {
    const moving: Record<string, number> = {}
    for (const p of this.players) moving[p.id] = len(this.vel[p.id][0], this.vel[p.id][1])
    return { pos: { ...this.pos }, face: { ...this.face }, holder: this.holder, moving }
  }

  // Avanza hasta el segundo `t`.
  run(t: number) { while (this.t + DT <= t + 1e-9) this.step() }
}

// La jugada entera calculada una sola vez (30 imágenes por segundo) para reproducirla y exportarla sin coste.
interface Baked { n: number; ids: string[]; pos: Float32Array; face: Float32Array; speed: Float32Array; holder: (string | null)[] }
const cache = new WeakMap<Clip, { b: Board; baked: Baked }>()

function bake(b: Board, clip: Clip): Baked {
  const hit = cache.get(clip)
  if (hit && hit.b.tokens === b.tokens) return hit.baked
  const sim = new Sim(b, { ...clip, passes: [...clip.passes] })
  const ids = b.tokens.map((t) => t.id)
  const n = Math.ceil(clip.dur * HZ) + 1
  const pos = new Float32Array(n * ids.length * 2), face = new Float32Array(n * ids.length), speed = new Float32Array(n * ids.length)
  const holder: (string | null)[] = []
  for (let f = 0; f < n; f++) {
    if (f) for (let k = 0; k < SUB; k++) sim.step()
    const v = sim.view()
    ids.forEach((id, j) => {
      const i = f * ids.length + j
      pos[i * 2] = v.pos[id][0]; pos[i * 2 + 1] = v.pos[id][1]
      face[i] = v.face[id] ?? 0; speed[i] = v.moving[id] ?? 0
    })
    holder.push(v.holder)
  }
  const baked = { n, ids, pos, face, speed, holder }
  cache.set(clip, { b, baked })
  return baked
}

// Lo que se ve en el segundo `s` de la jugada grabada.
export function clipView(b: Board, s: number): ClipView {
  const clip = b.clip!
  const k = bake(b, clip)
  const x = Math.max(0, Math.min(k.n - 1, s * HZ))
  const i = Math.min(Math.floor(x), k.n - 2 < 0 ? 0 : k.n - 2), u = k.n > 1 ? x - i : 0
  const out: ClipView = { pos: {}, face: {}, holder: k.holder[Math.round(x)] ?? null, moving: {} }
  const m = k.ids.length
  k.ids.forEach((id, j) => {
    const a = i * m + j, c = Math.min(k.n - 1, i + 1) * m + j
    out.pos[id] = [k.pos[a * 2] + (k.pos[c * 2] - k.pos[a * 2]) * u, k.pos[a * 2 + 1] + (k.pos[c * 2 + 1] - k.pos[a * 2 + 1]) * u]
    out.face[id] = k.face[a] + angDiff(k.face[a], k.face[c]) * u
    out.moving[id] = k.speed[a] + (k.speed[c] - k.speed[a]) * u
  })
  return out
}

// Al terminar una capa: suaviza un poco el temblor del dedo (media de unos 0,1 s) sin mover el principio ni el final.
export function smoothTrack(tr: Sample[], from: number): Sample[] {
  const out = tr.map((s) => [...s] as Sample)
  const w = 3
  for (let i = Math.max(1, from); i < tr.length - 1; i++) {
    let sx = 0, sy = 0, c = 0
    for (let j = i - w; j <= i + w; j++) if (j >= from && j < tr.length) { sx += tr[j][1]; sy += tr[j][2]; c++ }
    out[i][1] = +(sx / c).toFixed(3); out[i][2] = +(sy / c).toFixed(3)
  }
  return out
}

export const newClip = (auto = true): Clip => ({ dur: 0, tracks: {}, passes: [], auto })

// Quita los tiempos muertos: los ratos en los que nadie se mueve ni viaja el balón (mientras pensabas el siguiente
// movimiento al grabar) se acortan a `keep` segundos, y el final quieto se recorta. Devuelve la jugada nueva.
export function trimPauses(b: Board, keep = 0.7, min = 1.2): Clip {
  const clip = b.clip!
  const step = 1 / 30
  const n = Math.floor(clip.dur / step)
  const still: boolean[] = []
  let prev = clipView(b, 0)
  for (let i = 1; i <= n; i++) {
    const v = clipView(b, i * step)
    let moving = false
    for (const id of Object.keys(v.pos)) {
      const a = prev.pos[id], z = v.pos[id]
      if (Math.hypot(z[0] - a[0], z[1] - a[1]) / step > 0.8) { moving = true; break }
    }
    // Un pase a punto de salir también cuenta como acción.
    if (!moving && clip.passes.some((p) => Math.abs(p.t - i * step) < 0.25)) moving = true
    still.push(!moving)
    prev = v
  }
  // Tramos quietos largos: [inicio, fin] en segundos.
  const cuts: [number, number][] = []
  let s0 = -1
  for (let i = 0; i <= still.length; i++) {
    if (i < still.length && still[i]) { if (s0 < 0) s0 = i; continue }
    if (s0 >= 0) {
      const a = s0 * step, z = i * step
      const end = i >= still.length
      if (end) { if (z - a > 0.5) cuts.push([a + 0.6, z]) }
      else if (z - a > min) cuts.push([a + keep / 2, z - keep / 2])
      s0 = -1
    }
  }
  if (!cuts.length) return clip
  const map = (t: number) => {
    let out = t
    for (const [a, z] of cuts) { if (t >= z) out -= z - a; else if (t > a) { out -= t - a; break } else break }
    return +out.toFixed(3)
  }
  const tracks: Record<string, Sample[]> = {}
  for (const [id, tr] of Object.entries(clip.tracks)) {
    const out: Sample[] = []
    for (const [t, x, y] of tr) {
      const m = map(t)
      if (out.length && m <= out[out.length - 1][0]) out[out.length - 1] = [out[out.length - 1][0], x, y]
      else out.push([m, x, y])
    }
    tracks[id] = out
  }
  return { ...clip, tracks, passes: clip.passes.map((p) => ({ ...p, t: map(p.t) })), dur: map(clip.dur) }
}

// Convierte la jugada grabada en una animación por pasos: un paso en cada pase (y otro cada pocos segundos si
// hay mucho rato sin pases), con las flechas del pase y de las carreras. Así se puede escribir la explicación de
// cada paso y editarla como cualquier otra jugada.
export function clipToSteps(b0: Board): Board {
  // Primero se quitan los tiempos muertos, para que no salgan pasos en los que no pasa nada.
  const b: Board = { ...b0, clip: trimPauses(b0) }
  const clip = b.clip!
  const times = [0]
  // Justo antes de cada pase, cuando el balón aún lo tiene el que pasa.
  for (const p of clip.passes) if (p.t - 0.05 > times[times.length - 1] + 0.4 && p.t < clip.dur - 0.2) times.push(p.t - 0.05)
  times.push(clip.dur)
  // Tramos largos sin pases: se parten para que las carreras no se aplanen.
  const keys: number[] = []
  for (let i = 0; i < times.length - 1; i++) {
    const a = times[i], z = times[i + 1], parts = Math.max(1, Math.ceil((z - a) / 3.5))
    for (let k = 0; k < parts; k++) keys.push(a + ((z - a) * k) / parts)
  }
  keys.push(clip.dur)
  const views = keys.map((k) => clipView(b, k))

  const movers = b.tokens.filter((t) => t.kind === 'player' || t.kind === 'ball')
  const tokens = b.tokens.map((t) => { const p = views[0].pos[t.id]; return p ? { ...t, x: +p[0].toFixed(2), y: +p[1].toFixed(2) } : t })
  const frames: Frame[] = views.map((v, i) => {
    const pos: Record<string, Pt> = {}
    if (i > 0) for (const t of movers) {
      const a = views[i - 1].pos[t.id], z = v.pos[t.id]
      if (a && z && Math.hypot(z[0] - a[0], z[1] - a[1]) > 0.3) pos[t.id] = [+z[0].toFixed(2), +z[1].toFixed(2)]
    }
    return { pos, drawings: [], note: '' }
  })
  // Flechas de cada paso: lo que pasa hasta el siguiente (pase del balón y carreras de más de 2 m).
  for (let i = 0; i < views.length - 1; i++) {
    const v = views[i], w = views[i + 1]
    for (const t of movers) {
      const a = v.pos[t.id], z = w.pos[t.id]
      if (!a || !z || Math.hypot(z[0] - a[0], z[1] - a[1]) < 2) continue
      if (t.kind === 'ball') {
        if (v.holder && w.holder && v.holder !== w.holder) frames[i].drawings.push(line('pass', [a, z]))
      } else frames[i].drawings.push(line(t.team === 'away' ? 'press' : t.id === v.holder && t.id === w.holder ? 'dribble' : 'run', [a, z]))
    }
    // Explicación básica escrita sola; el entrenador la cambia a su gusto.
    const name = (id: string | null) => { const t = b.tokens.find((x) => x.id === id); return t ? (t.name?.trim() || t.label) : '' }
    const parts: string[] = []
    if (v.holder && w.holder && v.holder !== w.holder) parts.push(tr('El {a} pasa al {b}.', { a: name(v.holder), b: name(w.holder) }))
    else if (v.holder && v.holder === w.holder && frames[i].drawings.some((d) => d.type === 'dribble')) parts.push(tr('El {a} conduce.', { a: name(v.holder) }))
    const runners = movers.filter((t) => t.kind === 'player' && t.team !== 'away' && t.id !== v.holder && frames[i].drawings.some((d) => d.type === 'run' && d.points[0] === v.pos[t.id]))
    if (runners.length === 1) parts.push(tr('El {a} se desmarca.', { a: name(runners[0].id) }))
    else if (runners.length > 1) parts.push(tr('Se desmarcan {a}.', { a: runners.map((x) => name(x.id)).join(', ') }))
    const press = movers.filter((t) => t.kind === 'player' && t.team === 'away' && frames[i].drawings.some((d) => d.type === 'run' && d.points[0] === v.pos[t.id]))
    // Lo de la defensa solo se dice cuando empieza a ajustarse, no en todos los pasos.
    if (press.length && !(i > 0 && frames[i - 1].note.includes(tr('La defensa se ajusta y presiona.')))) parts.push(tr('La defensa se ajusta y presiona.'))
    frames[i].note = parts.join(' ')
  }
  return { ...b, tokens, clip: undefined, frames }
}
