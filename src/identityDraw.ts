import type { EndView, LineKind, Mark } from './identity'

// Dibuja la identidad del entrenador en las imágenes y los vídeos (en un lienzo), con la letra Montserrat.

const FONT = 'Montserrat, system-ui, sans-serif'
const WEIGHT: Record<LineKind, number> = { club: 800, coach: 700, slogan: 600 }

export async function fontsReady() {
  try {
    await Promise.all(['600', '700', '800'].map((w) => document.fonts.load(`${w} 24px Montserrat`, 'ÁÑáñ¡¿')))
  } catch { /* se usa la letra del sistema */ }
}

function spacing(ctx: CanvasRenderingContext2D, px: number) {
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`
}

// Reduce la letra hasta que el texto quepa; si ni así cabe, lo corta con «…».
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, min: number, maxW: number) {
  let s = size
  ctx.font = `${weight} ${s}px ${FONT}`
  while (ctx.measureText(text).width > maxW && s > min) { s -= 0.5; ctx.font = `${weight} ${s}px ${FONT}` }
  let t = text
  if (ctx.measureText(t).width > maxW) {
    while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
    t = t.trimEnd() + '…'
  }
  return { size: s, text: t }
}

// Parte el texto en líneas que quepan en el ancho dado.
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > max && line) { out.push(line); line = word } else line = next
  }
  if (line) out.push(line)
  return out
}

const SIZES = [[0.36], [0.32, 0.25], [0.27, 0.21, 0.2]]

// En fila, abajo a la derecha: el escudo a la derecha y el texto alineado a su izquierda.
// `right` y `top` marcan la esquina; `h` es el alto del escudo.
export function drawMarkRow(ctx: CanvasRenderingContext2D, m: Mark, crest: HTMLImageElement | null, right: number, top: number, h: number, maxW: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  let x = right
  if (crest) {
    const cw = Math.min(h * m.crestRatio, h * 2)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(crest, right - cw, top + (h - cw / m.crestRatio) / 2, cw, cw / m.crestRatio)
    x = right - cw - h * 0.25
  }
  const sizes = SIZES[Math.min(m.lines.length, 3) - 1] ?? []
  const lines = m.lines.slice(0, 3).map((l, i) => ({ ...l, ...fit(ctx, l.text, WEIGHT[l.kind], sizes[i] * h, sizes[i] * h * 0.6, maxW - (right - x)) }))
  const total = lines.reduce((a, l) => a + l.size * 1.22, 0)
  let y = top + h / 2 - total / 2
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = h * 0.06
  for (const [i, l] of lines.entries()) {
    ctx.font = `${WEIGHT[l.kind]} ${l.size}px ${FONT}`
    ctx.globalAlpha = alpha * (i === 0 ? 1 : 0.85)
    ctx.fillText(l.text, x, y + l.size * 0.08)
    y += l.size * 1.22
  }
  ctx.restore()
}

// En columna (vídeo): el escudo arriba y el texto centrado debajo, todo pegado abajo. Devuelve el alto usado.
export function drawMarkColumn(ctx: CanvasRenderingContext2D, m: Mark, crest: HTMLImageElement | null, cx: number, bottom: number, colW: number, alpha: number) {
  ctx.save()
  // Sin escudo hay más sitio y la letra puede ser más grande.
  const base = crest ? [17, 14, 13] : [20, 16, 15]
  // Cada línea usa la letra más grande con la que cabe en uno o dos renglones (el nombre y el cargo se separan
  // por el guion). Solo si ni así cabe se reduce más y, como mucho, se corta con «…».
  const rows: { kind: LineKind; text: string; size: number; first: boolean }[] = []
  m.lines.slice(0, 3).forEach((l, i) => {
    const w = (t: string, size: number) => { ctx.font = `${WEIGHT[l.kind]} ${size}px ${FONT}`; return ctx.measureText(t).width }
    const push = (ts: string[], size: number) => ts.forEach((t) => rows.push({ kind: l.kind, text: t, size, first: i === 0 }))
    // Primero en un renglón, bajando la letra hasta 14 px.
    for (let size = base[i]; size >= 14; size -= 1) if (w(l.text, size) <= colW) return push([l.text], size)
    // Si no, en dos renglones (el nombre y el cargo se separan por el guion).
    for (let size = base[i]; size >= 11; size -= 1) {
      ctx.font = `${WEIGHT[l.kind]} ${size}px ${FONT}`
      const split = l.text.includes(' — ') ? l.text.split(' — ') : wrap(ctx, l.text, colW)
      if (split.length <= 2 && split.every((t) => w(t, size) <= colW)) return push(split, size)
    }
    ctx.font = `${WEIGHT[l.kind]} 11px ${FONT}`
    const two = wrap(ctx, l.text, colW)
    push([two[0], fit(ctx, two.slice(1).join(' '), WEIGHT[l.kind], 11, 11, colW).text], 11)
  })
  const textH = rows.reduce((a, l) => a + l.size * 1.3, 0)
  const ch = crest ? Math.min(78, colW * 0.62, (colW * 0.62) / Math.max(0.5, m.crestRatio)) : 0
  const gap = crest && rows.length ? 10 : 0
  const top = bottom - textH - gap - ch
  ctx.globalAlpha = alpha
  if (crest) {
    const cw = ch * m.crestRatio
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(crest, cx - cw / 2, top, cw, ch)
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#ffffff'
  let y = top + ch + gap
  for (const l of rows) {
    ctx.font = `${WEIGHT[l.kind]} ${l.size}px ${FONT}`
    ctx.globalAlpha = alpha * (l.first ? 1 : 0.8)
    ctx.fillText(l.text, cx, y)
    y += l.size * 1.3
  }
  ctx.restore()
  return bottom - top
}

// Reparte la frase en renglones parecidos: si son dos frases cortas, una por renglón; si no, renglones equilibrados
// (sin dejar una palabra suelta al final).
function phraseLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const sentences = text.match(/[^.!?¡¿]*[.!?]+|\S[^.!?]*$/g)?.map((x) => x.trim()).filter(Boolean) ?? [text]
  if (sentences.length > 1 && sentences.length <= 3 && sentences.every((x) => ctx.measureText(x).width <= maxW)) return sentences
  const n = wrap(ctx, text, maxW).length
  let lo = maxW / n, hi = maxW
  for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (wrap(ctx, text, mid).length > n) lo = mid; else hi = mid }
  return wrap(ctx, text, hi)
}

// Duración total de la pantalla final: un segundo de entrada y luego la frase quieta el tiempo elegido.
export const endDuration = (e: EndView) => 1 + e.seconds

// Pantalla final con el mensaje del entrenador: fondo verde muy oscuro, escudo centrado y la frase como protagonista.
export function drawEndCard(ctx: CanvasRenderingContext2D, e: EndView, crest: HTMLImageElement | null, t: number, W: number, H: number) {
  const k = (a: number, b: number) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return 1 - Math.pow(1 - x, 3) }
  ctx.save()
  ctx.globalAlpha = k(0, 0.5)
  ctx.fillStyle = '#0f1712'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.45)
  glow.addColorStop(0, 'rgba(79,209,139,0.14)')
  glow.addColorStop(1, 'rgba(79,209,139,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  // Detalle verde fino arriba y abajo.
  ctx.fillStyle = '#4fd18b'
  ctx.globalAlpha = k(0.1, 0.7) * 0.9
  ctx.fillRect(0, 0, W, 4)
  ctx.fillRect(0, H - 4, W, 4)

  // Medidas de cada parte para centrarlo todo en vertical.
  const maxW = W * 0.8
  let size = 56
  let phrase: string[] = []
  // Si son dos o tres frases, se intenta una por renglón sin bajar mucho la letra.
  const sentences = e.phrase.match(/[^.!?¡¿]*[.!?]+|\S[^.!?]*$/g)?.map((x) => x.trim()).filter(Boolean) ?? []
  for (let sz = 56; sz >= 44 && sentences.length > 1 && sentences.length <= 3; sz -= 2) {
    ctx.font = `800 ${sz}px ${FONT}`
    if (sentences.every((x) => ctx.measureText(x).width <= maxW)) { size = sz; phrase = sentences; break }
  }
  while (!phrase.length) {
    ctx.font = `800 ${size}px ${FONT}`
    phrase = phraseLines(ctx, e.phrase, maxW)
    if (phrase.length > 3 && size > 30) { phrase = []; size -= 2 }
  }
  if (phrase.length > 4) { phrase = phrase.slice(0, 4); phrase[3] = phrase[3].replace(/\s*\S*$/, '') + '…' }
  const lineH = size * 1.2
  const ch = crest ? Math.min(150, H * 0.22) : 0
  const cw = crest ? Math.min(ch * e.crestRatio, W * 0.3) : 0
  const crestH = crest ? cw / e.crestRatio : 0
  const club = e.club ? fit(ctx, e.club.toUpperCase(), 700, 24, 14, maxW) : null
  const coach = e.coach ? fit(ctx, e.coach, 600, 26, 14, maxW) : null
  const slogan = e.slogan ? fit(ctx, e.slogan, 600, 20, 12, maxW) : null
  const parts = [crestH && crestH + 26, club && 24 + 22, phrase.length * lineH + 30, 22, coach && 26 + 10, slogan && 20 + 8].filter(Boolean) as number[]
  let y = H / 2 - parts.reduce((a, b) => a + b, 0) / 2
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  if (crest) {
    const a = k(0.2, 0.7), sc = 0.94 + 0.06 * a
    ctx.globalAlpha = a
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(crest, W / 2 - (cw * sc) / 2, y + (crestH * (1 - sc)) / 2, cw * sc, crestH * sc)
    y += crestH + 26
  }
  if (club) {
    const a = k(0.35, 0.85)
    ctx.globalAlpha = a
    ctx.fillStyle = '#4fd18b'
    ctx.font = `700 ${club.size}px ${FONT}`
    spacing(ctx, 3)
    ctx.fillText(club.text, W / 2, y + (1 - a) * 8)
    spacing(ctx, 0)
    y += 24 + 22
  }
  {
    const a = k(0.45, 1.0)
    ctx.globalAlpha = a
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 ${size}px ${FONT}`
    phrase.forEach((l, i) => ctx.fillText(l, W / 2, y + i * lineH + (1 - a) * 14))
    y += phrase.length * lineH + 30
  }
  {
    const a = k(0.7, 1.2)
    ctx.globalAlpha = a
    ctx.fillStyle = '#4fd18b'
    const bw = 72 * a
    ctx.fillRect(W / 2 - bw / 2, y - 4, bw, 4)
    y += 4 + 18
  }
  if (coach) {
    const a = k(0.8, 1.3)
    ctx.globalAlpha = a
    ctx.fillStyle = '#e8f3ec'
    ctx.font = `600 ${coach.size}px ${FONT}`
    ctx.fillText(coach.text, W / 2, y + (1 - a) * 8)
    y += 26 + 10
  }
  if (slogan) {
    const a = k(0.9, 1.4)
    ctx.globalAlpha = a * 0.85
    ctx.fillStyle = '#9fd8b5'
    ctx.font = `600 ${slogan.size}px ${FONT}`
    ctx.fillText(slogan.text, W / 2, y + (1 - a) * 8)
  }
  ctx.restore()
}
