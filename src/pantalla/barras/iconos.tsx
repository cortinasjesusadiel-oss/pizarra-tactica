import type { Tool } from '../../model'

// Dibujo de cada herramienta en su botón.
export function ToolIcon({ t }: { t: Tool }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {t === 'move' && <><circle cx="12" cy="12" r="5" {...s} /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" {...s} /></>}
      {t === 'pass' && <><path d="M4 18L18 6" {...s} /><path d="M12 6h6v6" {...s} /></>}
      {t === 'run' && <><path d="M4 18L18 6" {...s} strokeDasharray="3 3" /><path d="M12 6h6v6" {...s} /></>}
      {t === 'lob' && <><path d="M4 18Q10 2 19 14" {...s} /><path d="M19.5 8.5l-.5 5.5-5-1.5" {...s} /></>}
      {t === 'text' && <><path d="M5 6h14M12 6v13M9 19h6" {...s} /></>}
      {t === 'arrow' && <><path d="M4 18c3-8 8-11 14-12" {...s} /><path d="M13 4l5 2-3 4.5" {...s} /></>}
      {t === 'press' && <><path d="M4 18L16 8" {...s} /><path d="M13.5 4.5l6 7" {...s} /></>}
      {t === 'shot' && <><path d="M3 16L15 7M5 19L17 10" {...s} /><path d="M14 4.5l6 3-2.5 6" {...s} /></>}
      {t === 'line' && <path d="M4 18L20 6" {...s} />}
      {t === 'dline' && <path d="M4 18L20 6" {...s} strokeDasharray="0.1 4" strokeWidth={2.6} />}
      {t === 'darrow' && <><path d="M4 18c3-8 8-11 14-12" {...s} strokeDasharray="0.1 4" strokeWidth={2.6} /><path d="M13 4l5 2-3 4.5" {...s} /></>}
      {t === 'dribble' && <><path d="M3 14c2-4 4 4 6 0s4 4 6 0 3 2 4 0" {...s} /><path d="M17 9l3 4-4 2" {...s} /></>}
      {t === 'zone' && <rect x="4" y="6" width="16" height="12" rx="1" {...s} strokeDasharray="3 2" />}
      {t === 'focus' && <><circle cx="12" cy="12" r="7" {...s} /><circle cx="12" cy="12" r="2.5" {...s} /></>}
      {t === 'free' && <path d="M4 17c3-6 6 2 9-3s4-6 7-5" {...s} />}
      {t === 'erase' && <><path d="M8 20h12" {...s} /><path d="M4 15l9-9 6 6-7 7H8z" {...s} /></>}
    </svg>
  )
}
