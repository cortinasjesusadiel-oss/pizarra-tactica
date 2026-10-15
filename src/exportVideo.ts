import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ArrayBufferTarget, Muxer } from 'mp4-muxer'
import { PITCH, type Board } from './model'
import { SEG_MS, shownStep } from './motion'
import { Pitch } from './Pitch'
import { Scene } from './Scene'
import { Markers } from './Shapes'

// Exporta la jugada animada a un vídeo MP4 fluido (30 imágenes por segundo).
// Cada imagen se dibuja aparte con la posición exacta de cada ficha en ese instante, así no hay saltos
// aunque el móvil vaya lento: el vídeo se crea fotograma a fotograma y se reproduce siempre igual de suave.

const WIDTH = 1280
const HEIGHT = 720
const FPS = 30
const CAPTION = 84
const PAD = 3
const HOLD_START = 1.2
const HOLD_END = 2

type Result = { file: File } | 'unsupported'

const CODECS: { codec: string; mux: 'avc' | 'vp9' }[] = [
  { codec: 'avc1.4d0028', mux: 'avc' },
  { codec: 'avc1.42001f', mux: 'avc' },
  { codec: 'vp09.00.31.08', mux: 'vp9' },
]

async function pickCodec() {
  if (typeof VideoEncoder === 'undefined') return null
  for (const c of CODECS) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({ codec: c.codec, width: WIDTH, height: HEIGHT, bitrate: 6e6, framerate: FPS })
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

export interface ExportOpts { zones?: boolean; brand?: string; onProgress?: (k: number) => void }

export async function exportVideo(board: Board, opts: ExportOpts = {}): Promise<Result> {
  const n = board.frames?.length ?? 0
  const picked = await pickCodec()
  if (!picked || n < 2) return 'unsupported'

  const { w: W, h: H } = PITCH[board.pitch]
  const vbW = W + 2 * PAD, vbH = H + 2 * PAD
  const scale = Math.min(WIDTH / vbW, (HEIGHT - CAPTION) / vbH)
  const bw = Math.round(vbW * scale), bh = Math.round(vbH * scale)
  const bx = Math.round((WIDTH - bw) / 2), by = CAPTION + Math.round((HEIGHT - CAPTION - bh) / 2)
  const viewBox = `${-PAD} ${-PAD} ${vbW} ${vbH}`

  // El césped no cambia: se dibuja una sola vez.
  const grass = await svgImage(renderToStaticMarkup(createElement(Pitch, { kind: board.pitch, zones: opts.zones, brand: opts.brand })), viewBox, bw, bh)

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')!

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: picked.mux, width: WIDTH, height: HEIGHT, frameRate: FPS },
    fastStart: 'in-memory',
  })
  let failed: unknown = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { failed = e },
  })
  encoder.configure({ codec: picked.codec, width: WIDTH, height: HEIGHT, bitrate: 6e6, framerate: FPS })

  const moving = ((n - 1) * SEG_MS) / 1000
  const total = Math.round((HOLD_START + moving + HOLD_END) * FPS)
  for (let f = 0; f < total; f++) {
    if (failed) throw failed
    const sec = f / FPS
    const s = Math.max(0, Math.min(n - 1, ((sec - HOLD_START) * 1000) / SEG_MS))
    const markup = renderToStaticMarkup(createElement('g', null, createElement(Markers), createElement(Scene, { board, s, grass: false })))
    const scene = await svgImage(markup, viewBox, bw, bh)

    ctx.fillStyle = '#0f1712'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.drawImage(grass, bx, by, bw, bh)
    ctx.drawImage(scene, bx, by, bw, bh)

    // Explicación del paso arriba.
    const k = shownStep(board, s)
    const note = board.frames![k].note
    ctx.fillStyle = '#4fd18b'
    ctx.font = '700 22px system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText(`PASO ${k + 1}/${n}`, 28, 28)
    if (note) {
      ctx.fillStyle = '#e8eee9'
      ctx.font = '600 22px system-ui, sans-serif'
      wrap(ctx, note, WIDTH - 56).slice(0, 2).forEach((l, i) => ctx.fillText(l, 28, 56 + i * 24))
    }

    const frame = new VideoFrame(canvas, { timestamp: Math.round((f * 1e6) / FPS), duration: Math.round(1e6 / FPS) })
    encoder.encode(frame, { keyFrame: f % (FPS * 2) === 0 })
    frame.close()
    while (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 5))
    if (f % 5 === 0) opts.onProgress?.(f / total)
  }
  await encoder.flush()
  encoder.close()
  if (failed) throw failed
  muxer.finalize()
  opts.onProgress?.(1)
  const type = picked.mux === 'avc' ? 'video/mp4' : 'video/mp4; codecs=vp9'
  const blob = new Blob([muxer.target.buffer], { type })
  return { file: new File([blob], `tacticalpro-${new Date().toISOString().slice(0, 10)}.mp4`, { type: 'video/mp4' }) }
}

// Imagen PNG de una pizarra (siempre en horizontal), en el paso `s`.
export async function exportImage(board: Board, opts: ExportOpts & { s?: number } = {}): Promise<File> {
  const { w: W, h: H } = PITCH[board.pitch]
  const vbW = W + 2 * PAD, vbH = H + 2 * PAD
  const scale = 2000 / vbW
  const w = 2000, h = Math.round(vbH * scale)
  const markup = renderToStaticMarkup(createElement('g', null, createElement(Markers),
    createElement(Scene, { board, s: opts.s ?? 0, zones: opts.zones, brand: opts.brand })))
  const img = await svgImage(markup, `${-PAD} ${-PAD} ${vbW} ${vbH}`, w, h)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
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
