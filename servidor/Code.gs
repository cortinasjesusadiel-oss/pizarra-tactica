/**
 * TacticalPro · servidor de opiniones y contador «Me gusta».
 * Se instala como aplicación web de Google Apps Script en la cuenta tacticalproapp@gmail.com.
 * Guarda todo en la hoja de cálculo a la que está vinculado (panel privado) y avisa por correo.
 */
const AVISO = 'tacticalproapp@gmail.com'
const PAUSA_LIKE = 6 * 60 * 60     // segundos entre «Me gusta» desde el mismo navegador
const MAX_LIKES_MINUTO = 40         // freno global contra ráfagas automáticas
const MAX_OPINIONES_HORA = 5        // por correo

function doGet(e) {
  const accion = (e && e.parameter && e.parameter.accion) || 'likes'
  if (accion === 'likes') return json({ ok: true, likes: leerLikes() })
  return json({ ok: false, error: 'accion' })
}

function doPost(e) {
  let d = {}
  try { d = JSON.parse(e.postData.contents || '{}') } catch (err) { return json({ ok: false, error: 'json' }) }
  if (d.accion === 'like') return json(darLike(String(d.id || '').slice(0, 64)))
  if (d.accion === 'opinion') return json(guardarOpinion(d))
  return json({ ok: false, error: 'accion' })
}

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON) }
function libro() { return SpreadsheetApp.getActiveSpreadsheet() }
function hoja(nombre, cabecera) {
  let h = libro().getSheetByName(nombre)
  if (!h) { h = libro().insertSheet(nombre); if (cabecera) { h.appendRow(cabecera); h.setFrozenRows(1); h.getRange(1, 1, 1, cabecera.length).setFontWeight('bold') } }
  return h
}
function leerLikes() { return Number(hoja('Contador', ['Me gusta']).getRange('A2').getValue()) || 0 }

function darLike(id) {
  const cache = CacheService.getScriptCache()
  if (!/^[a-z0-9-]{8,64}$/i.test(id)) return { ok: false, error: 'id', likes: leerLikes() }
  if (cache.get('like_' + id)) return { ok: true, repetido: true, likes: leerLikes() }
  const minuto = 'min_' + Math.floor(Date.now() / 60000)
  const n = Number(cache.get(minuto) || 0)
  if (n >= MAX_LIKES_MINUTO) return { ok: false, error: 'espera', likes: leerLikes() }
  const lock = LockService.getScriptLock(); lock.waitLock(10000)
  try {
    const celda = hoja('Contador', ['Me gusta']).getRange('A2')
    const total = (Number(celda.getValue()) || 0) + 1
    celda.setValue(total)
    cache.put('like_' + id, '1', PAUSA_LIKE); cache.put(minuto, String(n + 1), 120)
    return { ok: true, likes: total }
  } finally { lock.releaseLock() }
}

// Evita que un texto se interprete como fórmula en la hoja.
function limpio(v, max) { let s = String(v == null ? '' : v).trim().slice(0, max); if (/^[=+\-@]/.test(s)) s = "'" + s; return s }
const FUNCIONES = ['entrenador', 'asistente', 'analista', 'profesor', 'otra']

function guardarOpinion(d) {
  if (d.web) return { ok: true } // campo trampa para robots
  const correo = limpio(d.correo, 120).toLowerCase()
  const opinion = limpio(d.opinion, 3000)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { ok: false, error: 'correo' }
  if (opinion.length < 3) return { ok: false, error: 'opinion' }
  const probado = d.probado === 'si' ? 'Sí' : 'Todavía no'
  const funcion = FUNCIONES.indexOf(d.funcion) >= 0 ? d.funcion : 'otra'
  const probador = d.probador === true
  const android = probador && d.android === true
  const correoPlay = probador ? limpio(d.correoPlay, 120).toLowerCase() : ''
  if (probador && (!android || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoPlay))) return { ok: false, error: 'probador' }
  const novedades = d.novedades === true
  const idioma = d.idioma === 'en' ? 'en' : 'es'

  const cache = CacheService.getScriptCache(), clave = 'op_' + Utilities.base64EncodeWebSafe(correo).slice(0, 200)
  const veces = Number(cache.get(clave) || 0)
  if (veces >= MAX_OPINIONES_HORA) return { ok: false, error: 'espera' }
  cache.put(clave, String(veces + 1), 3600)

  const fecha = new Date()
  hoja('Opiniones', ['Fecha', 'Correo', '¿Ha probado TacticalPro?', 'Función', 'Opinión', 'Quiere ser probador Android', 'Tiene Android', 'Correo de Google Play', 'Quiere novedades', 'Idioma'])
    .appendRow([fecha, correo, probado, funcion, opinion, probador ? 'Sí' : 'No', probador ? (android ? 'Sí' : 'No') : '', correoPlay, novedades ? 'Sí' : 'No', idioma])

  const asunto = 'TacticalPro · Nueva opinión' + (probador ? ' · voluntario Android' : '')
  const cuerpo = [
    'Correo: ' + correo,
    '¿Ha probado TacticalPro?: ' + probado,
    'Función: ' + funcion,
    '',
    'Opinión:',
    opinion,
    '',
    'Quiere ser probador Android: ' + (probador ? 'Sí (pendiente de incorporar a la prueba)' : 'No'),
    probador ? 'Correo de Google Play: ' + correoPlay : '',
    'Quiere novedades: ' + (novedades ? 'Sí' : 'No'),
    'Idioma: ' + idioma,
    '',
    'Todas las respuestas: ' + libro().getUrl()
  ].filter(function (l, i, a) { return l !== '' || a[i - 1] !== '' }).join('\n')
  MailApp.sendEmail({ to: AVISO, subject: asunto, body: cuerpo, replyTo: correo, name: 'TacticalPro' })
  return { ok: true }
}

/** Ejecuta esta función una vez desde el editor para crear las hojas y dar los permisos. */
function preparar() {
  hoja('Opiniones', ['Fecha', 'Correo', '¿Ha probado TacticalPro?', 'Función', 'Opinión', 'Quiere ser probador Android', 'Tiene Android', 'Correo de Google Play', 'Quiere novedades', 'Idioma'])
  const c = hoja('Contador', ['Me gusta']); if (c.getRange('A2').getValue() === '') c.getRange('A2').setValue(0)
  MailApp.getRemainingDailyQuota()
}
