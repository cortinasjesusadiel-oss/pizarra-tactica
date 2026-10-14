// Convierte la pizarra en PNG. En Android abre el menú de compartir (WhatsApp, etc.) y si no, descarga el archivo.
export async function exportPng(svg: SVGSVGElement): Promise<'shared' | 'saved' | 'failed'> {
  try {
    const vb = svg.viewBox.baseVal
    const scale = 2000 / Math.max(vb.width, vb.height)
    const w = Math.round(vb.width * scale), h = Math.round(vb.height * scale)
    const root = getComputedStyle(document.documentElement)
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(w))
    clone.setAttribute('height', String(h))
    const src = new XMLSerializer()
      .serializeToString(clone)
      .replace(/var\((--[\w-]+)\)/g, (_, name: string) => root.getPropertyValue(name).trim() || '#000')
    const img = new Image()
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src)
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) return 'failed'
    const file = new File([blob], `pizarra-${new Date().toISOString().slice(0, 10)}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Pizarra táctica' })
        return 'shared'
      } catch {
        /* el usuario canceló o el navegador no permite compartir: se descarga */
      }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = file.name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    return 'saved'
  } catch {
    return 'failed'
  }
}
