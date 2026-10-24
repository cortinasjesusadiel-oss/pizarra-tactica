// Los atajos de la pizarra (Supr, Retroceso, Ctrl+Z, espacio…) no deben actuar mientras se escribe un texto:
// en una nota, Retroceso borra una letra, no la ficha seleccionada.
export function isTyping(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.isComposing) return true
  const el = e.target
  if (!(el instanceof Element)) return false
  if (el.closest('input, textarea, select')) return true
  return el instanceof HTMLElement && el.isContentEditable === true
}
