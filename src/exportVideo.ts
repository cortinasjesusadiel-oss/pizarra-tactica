import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArrayBufferTarget, Muxer } from 'mp4-muxer'
import { PITCH, type Board, type Look } from './model'
import { DEFAULT_PACE, caption, paceAt, paceTotal, type Pace } from './motion'
import { Pitch } from './Pitch'
import { Scene } from './Scene'
import { Markers } from './Shapes'
import logoFull from './logoFull.webp'
import type { EndView, Mark } from './identity'
import { drawEndCard, drawMarkColumn, drawMarkRow, endDuration, fontsReady } from './identityDraw'
import { t, t as i18n, tr } from './i18n'

// Exporta la jugada animada a un vídeo MP4 fluido (30 imágenes por segundo).
// Cada imagen se dibuja aparte con la posición exacta de cada ficha en ese instante, así no hay saltos
// aunque el móvil vaya lento: el vídeo se crea fotograma a fotograma y se reproduce siempre igual de suave.

// El vídeo sale en Full HD (1920×1080). Todo se coloca en medidas de 1280×720 y se amplía ×1,5 al dibujar,
// así las fichas y las letras salen nítidas.
const WIDTH = 1280
const HEIGHT = 720
const K = 1.5
const OUT_W = WIDTH * K, OUT_H = HEIGHT * K
// «Campo a todo el ancho»: el fotograma crece hacia abajo para que el campo ocupe todo el ancho.
// Se saca a 1600 px de ancho para que el vídeo siga siendo compatible con móviles y WhatsApp.
const K_FULL = 1.25
const BITRATE = 10e6
const FPS = 30
const OUTRO = 3.2
const PAD = 3

type Result = { file: File } | 'unsupported'

const CODECS: { codec: string; mux: 'avc' | 'vp9' }[] = [
  { codec: 'avc1.640028', mux: 'avc' },
  { codec: 'avc1.4d0028', mux: 'avc' },
  { codec: 'avc1.42002a', mux: 'avc' },
  { codec: 'vp09.00.40.08', mux: 'vp9' },
]

async function pickCodec() {
  if (typeof VideoEncoder === 'undefined') return null
  for (const c of CODECS) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({ codec: c.codec, width: OUT_W, height: OUT_H, bitrate: BITRATE, framerate: FPS })
      if (supported) return c
    } catch { /* se prueba el siguiente */ }
  }
  return null
}

function svgImage(markup: string, viewBox: string, w: number, h: number): Promise<HTMLImageElement> {
  const root = getComputedStyle(document.documentElement)
  const src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${markup}</svg>`
    .replace(/var\((--[\w-]+)\)/g, (_, name: string) => root.getPropertyValue(name).trim() || '#000')
  const img = new Image()
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src)
  return img.decode().then(() => img)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = src
  return img.decode().then(() => img)
}

// Pantalla final: la jugada se funde a negro y aparece el logo con el lema.
function drawOutro(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, t: number, HEIGHT: number) {
  const e = (a: number, b: number) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return 1 - Math.pow(1 - x, 3) }
  ctx.globalAlpha = e(0, 0.6)
  ctx.fillStyle = '#0f1712'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.42, 0, WIDTH / 2, HEIGHT * 0.42, 420)
  glow.addColorStop(0, 'rgba(79,209,139,0.18)')
  glow.addColorStop(1, 'rgba(79,209,139,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  const a = e(0.3, 1.0)
  const lw = 380, lh = (lw * logo.naturalHeight) / logo.naturalWidth
  const sc = 0.92 + 0.08 * a
  ctx.globalAlpha = a
  ctx.drawImage(logo, WIDTH / 2 - (lw * sc) / 2, HEIGHT * 0.4 - (lh * sc) / 2, lw * sc, lh * sc)
  const b = e(0.8, 1.5)
  ctx.globalAlpha = b
  ctx.fillStyle = '#cfe9da'
  ctx.font = '800 26px Montserrat, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '6px'
  ctx.fillText(i18n('APRENDE · PLANIFICA · ENTRENA'), WIDTH / 2, HEIGHT * 0.4 + lh / 2 + 52 - (1 - b) * 12)
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'
  ctx.textAlign = 'left'
  ctx.globalAlpha = 1
}

export interface ExportOpts { zones?: boolean; brand?: string; look?: Look; pace?: Pace
  // Letra grande para verlo en el móvil (WhatsApp, redes) y pantalla final con el logo y el lema.
  big?: boolean; outro?: boolean
  // Campo a todo el ancho (fotograma más alto que el 16:9 de siempre).
  full?: boolean
  // Identidad del entrenador (abajo a la derecha) y su pantalla final con el mensaje.
  ident?: Mark | null; end?: EndView | null
  onProgress?: (k: number) => void }

export interface Renderer { canvas: HTMLCanvasElement; seconds: number; animSeconds: number; draw: (sec: number) => Promise<void> }

// Prepara el dibujo de cada instante del vídeo. Lo usan el exportador y la vista previa, así se ve exactamente igual.
export async function videoRenderer(board: Board, opts: ExportOpts = {}, canvas = document.createElement('canvas')): Promise<Renderer> {
  const n = board.frames?.length ?? 0
  // Texto del paso en una franja fina arriba y el campo lo más grande posible debajo.
  // Sin explicaciones en los pasos basta con una franja más fina para «PASO 2/5».
  const hasNotes = !!board.frames?.some((f) => f.note.trim())
  const CAPTION = !hasNotes ? (opts.big ? 52 : 44) : opts.big ? 92 : 68
  const { w: W, h: H } = PITCH[board.pitch]
  // Poco margen alrededor del campo; abajo se deja el sitio de la marca de siempre (logo o texto).
  const M = 1.5
  const vbW = W + 2 * M, vbH = H + M + PAD
  const scale = opts.full ? WIDTH / vbW : Math.min((WIDTH - 16) / vbW, (HEIGHT - CAPTION - 8) / vbH)
  const bw = Math.round(vbW * scale), bh = Math.round(vbH * scale)
  const k = opts.full ? K_FULL : K
  // Alto del fotograma (en las mismas unidades que el ancho de 1280). Par al multiplicarlo, como piden los códecs.
  const HEIGHT_ = opts.full ? Math.ceil((CAPTION + bh) * k / 2) * 2 / k : HEIGHT
  const bx = Math.round((WIDTH - bw) / 2), by = CAPTION + Math.round((HEIGHT_ - CAPTION - bh) / 2)
  const viewBox = `${-M} ${-M} ${vbW} ${vbH}`

  await fontsReady()
  // El césped no cambia: se dibuja una sola vez.
  const grass = await svgImage(renderToStaticMarkup(createElement(Pitch, { kind: board.pitch, zones: opts.zones, brand: opts.brand })), viewBox, bw * k, bh * k)
  const logo = opts.outro ? await loadImage(logoFull) : null
  const crest = opts.ident?.crest ? await loadImage(opts.ident.crest).catch(() => null) : null
  const endCrest = opts.end?.crest ? await loadImage(opts.end.crest).catch(() => null) : null

  canvas.width = Math.round(WIDTH * k)
  canvas.height = Math.round(HEIGHT_ * k)
  const ctx = canvas.getContext('2d')!

  // Cada paso dura lo elegido (5, 8 o 10 s): quietos para leer y luego el movimiento al siguiente.
  const pace = opts.pace ?? DEFAULT_PACE
  const animSec = paceTotal(n, pace)
  const endSec = opts.end ? endDuration(opts.end) : 0
  const seconds = animSec + endSec + (logo ? OUTRO : 0)
  let lastScene: { s: number; img: HTMLImageElement } | null = null

  const draw = async (sec: number) => {
    const s = paceAt(n, pace, Math.min(sec, animSec))
    // En las pantallas finales la jugada ya no se mueve: se reutiliza la última imagen.
    const scene = lastScene && lastScene.s === s ? lastScene.img
      : await svgImage(renderToStaticMarkup(createElement('g', null, createElement(Markers), createElement(Scene, { board, s, grass: false, look: opts.look }))), viewBox, bw * k, bh * k)
    lastScene = { s, img: scene }

    ctx.setTransform(k, 0, 0, k, 0, 0)
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#0f1712'
    ctx.fillRect(0, 0, WIDTH, HEIGHT_)
    ctx.drawImage(grass, bx, by, bw, bh)
    ctx.drawImage(scene, bx, by, bw, bh)

    // Explicación del paso arriba. Al cambiar de paso, el texto nuevo se funde sobre el anterior.
    const cap = caption(board, s)
    const drawCaption = (j: number, alpha: number) => {
      const size = opts.big ? 27 : 20, lh = Math.round(size * 1.24), x = 24, y0 = opts.big ? 28 : 22
      ctx.globalAlpha = alpha
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#4fd18b'
      ctx.font = `800 ${size}px system-ui, sans-serif`
      const label = t('PASO {i}/{n}', { i: j + 1, n })
      ctx.fillText(label, x, y0)
      const indent = ctx.measureText(label).width + size * 0.6
      const note = tr(board.frames![j].note)
      if (note) {
        ctx.fillStyle = '#ffffff'
        ctx.font = `700 ${size}px system-ui, sans-serif`
        // Primer renglón al lado de «PASO», el segundo debajo; si no cabe, se corta con «…».
        const max = WIDTH - 2 * x
        const words = note.split(/\s+/)
        const lines = ['', '']
        let k = 0
        for (const w of words) {
          const next = lines[k] ? `${lines[k]} ${w}` : w
          if (ctx.measureText(next).width > max - (k === 0 ? indent : 0) && lines[k]) { if (k === 1) { lines[1] += ' …'; break } k = 1; lines[1] = w } else lines[k] = next
        }
        while (ctx.measureText(lines[1]).width > max && lines[1].length > 2) lines[1] = lines[1].slice(0, -3).trimEnd() + ' …'
        ctx.fillText(lines[0], x + indent, y0)
        if (lines[1]) ctx.fillText(lines[1], x, y0 + lh)
      }
      ctx.globalAlpha = 1
    }
    // Primero se va la explicación anterior y luego entra la nueva, para que no se monten las dos.
    if (cap.fade < 0.5) drawCaption(cap.prev, 1 - cap.fade * 2)
    else drawCaption(cap.k, cap.fade * 2 - 1)

    // La identidad va en la franja libre a la derecha del campo, abajo: nunca tapa jugadores, flechas ni líneas.
    if (opts.ident) {
      const right0 = bx + bw
      const colW = WIDTH - right0 - 20
      if (colW >= 100) drawMarkColumn(ctx, opts.ident, crest, right0 + (WIDTH - right0) / 2, HEIGHT_ - 18, colW, 0.85)
      else drawMarkRow(ctx, opts.ident, crest, bx + bw - M * scale, by + bh - PAD * scale + 0.25 * scale, 2.5 * scale, W * 0.6 * scale, 0.75)
    }

    const endT = sec - animSec
    if (opts.end && endT > 0) drawEndCard(ctx, opts.end, endCrest, endT, WIDTH, HEIGHT_)
    const outroT = sec - animSec - endSec
    if (logo && outroT > 0) drawOutro(ctx, logo, outroT, HEIGHT_)
  }

  return { canvas, seconds, animSeconds: animSec, draw }
}

export async function exportVideo(board: Board, opts: ExportOpts = {}): Promise<Result> {
  const n = board.frames?.length ?? 0
  const picked = await pickCodec()
  if (!picked || n < 2) return 'unsupported'
  const r = await videoRenderer(board, opts)
  const OUT_W = r.canvas.width, OUT_H = r.canvas.height

  // Se dibuja y codifica fotograma a fotograma. Si el codificador del equipo falla (pasa con algunas tarjetas
  // gráficas en Windows), se vuelve a intentar con otro formato o con el codificador por software.
  const attempt = async (c: (typeof CODECS)[number], hw: HardwareAcceleration): Promise<Blob> => {
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: c.mux, width: OUT_W, height: OUT_H, frameRate: FPS },
      fastStart: 'in-memory',
    })
    let failed: unknown = null
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => { failed = e },
    })
    encoder.configure({ codec: c.codec, width: OUT_W, height: OUT_H, bitrate: BITRATE, framerate: FPS, hardwareAcceleration: hw })
    const total = Math.round(r.seconds * FPS)
    for (let f = 0; f < total; f++) {
      if (failed) { if (encoder.state !== 'closed') encoder.close(); throw failed }
      await r.draw(f / FPS)
      const frame = new VideoFrame(r.canvas, { timestamp: Math.round((f * 1e6) / FPS), duration: Math.round(1e6 / FPS) })
      encoder.encode(frame, { keyFrame: f % (FPS * 2) === 0 })
      frame.close()
      while (encoder.encodeQueueSize > 8) await new Promise((res) => setTimeout(res, 5))
      if (f % 5 === 0) opts.onProgress?.(f / total)
    }
    await encoder.flush()
    encoder.close()
    if (failed) throw failed
    muxer.finalize()
    opts.onProgress?.(1)
    return new Blob([muxer.target.buffer], { type: 'video/mp4' })
  }

  let lastError: unknown = null
  for (const c of [picked, ...CODECS.filter((x) => x !== picked)]) {
    for (const hw of ['no-preference', 'prefer-software'] as HardwareAcceleration[]) {
      try {
        const { supported } = await VideoEncoder.isConfigSupported({ codec: c.codec, width: OUT_W, height: OUT_H, bitrate: BITRATE, framerate: FPS, hardwareAcceleration: hw })
        if (!supported) continue
        const blob = await attempt(c, hw)
        return { file: new File([blob], `tacticalpro-${new Date().toISOString().slice(0, 10)}.mp4`, { type: 'video/mp4' }) }
      } catch (e) { lastError = e; opts.onProgress?.(0) }
    }
  }
  throw lastError ?? new Error(t('sin codificador'))
}

// Imagen PNG de una pizarra (siempre en horizontal), en el paso `s`.
export async function exportImage(board: Board, opts: ExportOpts & { s?: number } = {}): Promise<File> {
  const { w: W, h: H } = PITCH[board.pitch]
  const vbW = W + 2 * PAD, vbH = H + 2 * PAD
  const scale = 2000 / vbW
  const w = 2000, h = Math.round(vbH * scale)
  const markup = renderToStaticMarkup(createElement('g', null, createElement(Markers),
    createElement(Scene, { board, s: opts.s ?? 0, zones: opts.zones, brand: opts.brand, look: opts.look })))
  const img = await svgImage(markup, `${-PAD} ${-PAD} ${vbW} ${vbH}`, w, h)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  if (opts.ident) {
    await fontsReady()
    const crest = opts.ident.crest ? await loadImage(opts.ident.crest).catch(() => null) : null
    drawMarkRow(ctx, opts.ident, crest, (PAD + W) * scale, (PAD + H + 0.25) * scale, 2.5 * scale, W * 0.6 * scale, 0.7)
  }
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
  if (!blob) throw new Error('png')
  return new File([blob], `tacticalpro-${new Date().toISOString().slice(0, 10)}.png`, { type: 'image/png' })
}

const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'jugada'

// Exporta varias pizarras seguidas: las animadas en vídeo y las demás en imagen.
export async function exportMany(items: { name: string; board: Board }[], opts: ExportOpts & { onItem?: (i: number) => void }): Promise<File[]> {
  const out: File[] = []
  const used = new Set<string>()
  for (const [i, it] of items.entries()) {
    opts.onItem?.(i)
    let file: File
    if ((it.board.frames?.length ?? 0) > 1) {
      const res = await exportVideo(it.board, opts)
      file = res === 'unsupported' ? await exportImage(it.board, opts) : res.file
    } else file = await exportImage(it.board, opts)
    let name = `${i + 1}-${slug(it.name)}`
    while (used.has(name)) name += '-b'
    used.add(name)
    out.push(new File([file], `${name}.${file.type === 'image/png' ? 'png' : 'mp4'}`, { type: file.type }))
  }
  return out
}

// Dentro de Claude (la demo) las descargas pasan por el permiso de descargas de la página.
type Downloads = { save: (r: { filename: string; data: Blob }) => Promise<unknown> }
async function claudeDownloads(): Promise<Downloads | null> {
  const c = (window as unknown as { claude?: { use?: (name: string) => Promise<unknown> } }).claude
  if (!c?.use) return null
  try { return (await c.use('downloads')) as Downloads | null } catch { return null }
}

export async function saveFiles(files: File[]) {
  const dl = await claudeDownloads()
  if (dl) {
    for (const file of files) await dl.save({ filename: file.name, data: file })
    return
  }
  for (const file of files) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = file.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 20000)
    // Pequeña pausa entre descargas para que el navegador no bloquee las siguientes.
    await new Promise((r) => setTimeout(r, 400))
  }
}

export async function shareFiles(files: File[]): Promise<boolean> {
  if (!navigator.canShare?.({ files })) return false
  try {
    await navigator.share({ files, title: 'TacticalPro' })
    return true
  } catch {
    return false
  }
}
