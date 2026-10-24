import { LABEL_DEFAULT_BG, type Drawing, type Pt } from '../../nucleo/model'
import { leerEstiloLetrero } from '../../nucleo/preferencias'

// Letrero que se está escribiendo o editando, con su estilo.
export type LabelEdit = { id: string; p: Pt; text: string; color: string; bg: string; fs: number }
// Un letrero nuevo usa el último estilo elegido.
export function newLabel(p: Pt): LabelEdit {
  const st = leerEstiloLetrero()
  return { id: '', p, text: '', color: st.color ?? '#ffffff', bg: st.bg ?? LABEL_DEFAULT_BG, fs: st.fs ?? 2.1 }
}
export const editLabel = (d: Drawing): LabelEdit => ({ id: d.id, p: d.points[0], text: d.text ?? '', color: d.color, bg: d.bg ?? LABEL_DEFAULT_BG, fs: d.fs ?? 2.1 })
