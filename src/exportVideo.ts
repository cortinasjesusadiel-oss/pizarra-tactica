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

export async function exportVideo(board: Board, opts: { zones?: boolean; onProgress?: (k: number) => void } = {}): Promise<Result> {
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
  const grass = await svgImage(renderToStaticMarkup(createElement(Pitch, { kind: board.pitch, zones: opts.zones })), viewBox, bw, bh)

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
    ctx.font = '800 20px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(255,255,255,.75)'
    ctx.fillText('TacticalPro', WIDTH - 28, 28)
    ctx.textAlign = 'left'

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

export function saveFile(file: File) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10000)
}

export async function shareFile(file: File): Promise<boolean> {
  if (!navigator.canShare?.({ files: [file] })) return false
  try {
    await navigator.share({ files: [file], title: 'TacticalPro' })
    return true
  } catch {
    return false
  }
}
