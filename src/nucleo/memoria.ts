// Lectura y escritura de lo que se guarda en el dispositivo (localStorage).
// Si el navegador no deja guardar (modo incógnito, sin espacio…), nada falla: se lee el valor por defecto y no se guarda.

export function leer(k: string): string | null {
  try { return localStorage.getItem(k) } catch { return null }
}

export function guardar(k: string, v: string): void {
  try { localStorage.setItem(k, v) } catch { /* sin almacenamiento */ }
}

// Objeto guardado mezclado sobre sus valores por defecto (así una opción nueva siempre tiene valor).
export function leerJson<T extends object>(k: string, f: T): T {
  try { return { ...f, ...JSON.parse(localStorage.getItem(k) ?? '{}') } } catch { return f }
}
